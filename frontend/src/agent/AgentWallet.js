/**
 * AiFund Pay v3.0 — AI Agent Payment SDK
 * Autonomous payment for AI agents. Pay-per-request. Zero human intervention.
 * https://aifund.com/pay
 * 
 * Architecture:
 *   Agent discovers paid API → API returns 402 → Agent auto-pays → Gets data
 * 
 * Features:
 *   - Budget limits (max per-request, max per-hour, max total)
 *   - Auto-approve within budget, reject over budget
 *   - Payment receipt logging for audit
 *   - Works with x402 protocol
 *   - Agent-to-agent payments
 */

/**
 * Create an AI Agent wallet that can make autonomous payments.
 * 
 * @param {Object} options
 * @param {string} options.privateKeyOrSigner - Wallet private key or signer function
 * @param {string} options.backendUrl - Payment backend URL
 * @param {Object} options.budget - Budget limits
 * @param {number} options.budget.maxPerRequest - Max USD per single request (default: $0.10)
 * @param {number} options.budget.maxPerHour - Max USD per hour (default: $1.00)  
 * @param {number} options.budget.maxTotal - Max total USD lifetime (default: $100)
 * @param {Function} options.onPayment - Callback when payment is made
 * @param {Function} options.onBudgetExceeded - Callback when budget limit hit
 */
export class AgentWallet {
  constructor(options = {}) {
    this.backendUrl = options.backendUrl || '';
    this.budget = {
      maxPerRequest: options.budget?.maxPerRequest ?? 0.10,
      maxPerHour: options.budget?.maxPerHour ?? 1.00,
      maxTotal: options.budget?.maxTotal ?? 100,
    };
    this.onPayment = options.onPayment || (() => {});
    this.onBudgetExceeded = options.onBudgetExceeded || (() => {});

    // Tracking
    this.totalSpent = 0;
    this.hourlySpent = 0;
    this.hourlyResetTime = Date.now() + 3600000;
    this.paymentLog = [];
    this.address = options.address || '';
    this.signer = options.signer || null;
  }

  /**
   * Check if a payment amount is within budget
   */
  canPay(amount) {
    // Reset hourly counter if needed
    if (Date.now() > this.hourlyResetTime) {
      this.hourlySpent = 0;
      this.hourlyResetTime = Date.now() + 3600000;
    }

    if (amount > this.budget.maxPerRequest) {
      return { allowed: false, reason: `Exceeds per-request limit ($${this.budget.maxPerRequest})` };
    }
    if (this.hourlySpent + amount > this.budget.maxPerHour) {
      return { allowed: false, reason: `Would exceed hourly limit ($${this.budget.maxPerHour})` };
    }
    if (this.totalSpent + amount > this.budget.maxTotal) {
      return { allowed: false, reason: `Would exceed total budget ($${this.budget.maxTotal})` };
    }
    return { allowed: true };
  }

  /**
   * Process a payment (called when 402 is received)
   */
  async pay(paymentDetails) {
    const amount = paymentDetails.amount || 0;
    const check = this.canPay(amount);

    if (!check.allowed) {
      this.onBudgetExceeded({ amount, reason: check.reason, details: paymentDetails });
      throw new Error(`Budget exceeded: ${check.reason}`);
    }

    // Create payment authorization
    const authorization = {
      from: this.address,
      to: paymentDetails.recipient,
      amount: amount,
      currency: paymentDetails.currency || 'USDC',
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2, 10),
      description: paymentDetails.description || '',
    };

    // Sign if signer available
    let signature = '';
    if (this.signer) {
      const message = JSON.stringify(authorization);
      signature = await this.signer(message);
    }

    // Record payment
    const record = {
      ...authorization,
      signature,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    this.totalSpent += amount;
    this.hourlySpent += amount;
    this.paymentLog.push(record);
    this.onPayment(record);

    return {
      authorization: btoa(JSON.stringify({ ...authorization, signature })),
      record,
    };
  }

  /**
   * Get spending summary
   */
  getStats() {
    return {
      totalSpent: this.totalSpent,
      hourlySpent: this.hourlySpent,
      remainingBudget: this.budget.maxTotal - this.totalSpent,
      remainingHourly: this.budget.maxPerHour - this.hourlySpent,
      paymentCount: this.paymentLog.length,
      budget: this.budget,
    };
  }

  /**
   * Get payment history
   */
  getPaymentLog() {
    return [...this.paymentLog];
  }

  /**
   * Reset budget counters (e.g., top up)
   */
  resetBudget(newTotal) {
    if (newTotal !== undefined) this.budget.maxTotal = newTotal;
    this.totalSpent = 0;
    this.hourlySpent = 0;
  }
}

/**
 * Create a fetch-like function for agents that auto-handles 402 payments.
 * Drop-in replacement for fetch() that pays when needed.
 * 
 * Usage:
 *   const agentFetch = createAgentFetch(wallet);
 *   const data = await agentFetch('https://api.example.com/data');
 *   // If API returns 402, wallet auto-pays and retries
 */
export function createAgentFetch(agentWallet) {
  return async function agentFetch(url, options = {}) {
    // First attempt
    const response = await fetch(url, options);

    if (response.status !== 402) {
      return response;
    }

    // Parse 402 payment details
    let paymentDetails;
    try {
      const body = await response.json();
      paymentDetails = body.payment || body;
    } catch {
      throw new Error('402 received but could not parse payment details');
    }

    // Auto-pay
    const { authorization } = await agentWallet.pay(paymentDetails);

    // Retry with payment header
    const retryOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        'X-PAYMENT': authorization,
      },
    };

    return fetch(url, retryOptions);
  };
}

/**
 * Agent-to-Agent payment: one agent pays another directly
 * 
 * Usage:
 *   await agentToAgentPay(senderWallet, recipientAddress, 0.01, 'Data processing fee');
 */
export async function agentToAgentPay(senderWallet, recipientAddress, amount, description = '') {
  return senderWallet.pay({
    recipient: recipientAddress,
    amount,
    currency: 'USDC',
    description: description || 'Agent-to-agent payment',
  });
}
