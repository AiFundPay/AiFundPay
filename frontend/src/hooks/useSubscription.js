/**
 * AiFund Pay — Subscription Payments
 * Recurring on-chain billing with ERC-20 approve + periodic pull.
 * https://aifund.com/pay
 * 
 * How it works:
 *   1. User approves a spending allowance (one-time wallet signature)
 *   2. Backend periodically calls transferFrom() to collect payment
 *   3. If balance insufficient or allowance revoked, subscription pauses
 * 
 * For non-smart-contract use (most common):
 *   - Backend tracks subscription periods
 *   - Sends payment reminder before each period
 *   - User pays manually or via auto-pay (with saved payment preference)
 */
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

export function useSubscription(walletAddress, options = {}) {
  const api = `${options.backendUrl || config.backendUrl}/api`;
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load existing subscription
  const loadSubscription = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const res = await axios.get(`${api}/subscription/${walletAddress}`);
      setSubscription(res.data.subscription);
    } catch (e) {
      setSubscription(null);
    }
  }, [walletAddress, api]);

  useEffect(() => { loadSubscription(); }, [loadSubscription]);

  // Create new subscription
  const subscribe = useCallback(async (planId, paymentToken = 'USDT', paymentChain = 'trc20') => {
    setLoading(true);
    try {
      const res = await axios.post(`${api}/subscription/create`, {
        wallet_address: walletAddress,
        plan_id: planId,
        payment_token: paymentToken,
        payment_chain: paymentChain,
      });
      setSubscription(res.data.subscription);
      return { success: true, subscription: res.data.subscription };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [walletAddress, api]);

  // Cancel subscription
  const cancel = useCallback(async () => {
    setLoading(true);
    try {
      await axios.post(`${api}/subscription/cancel`, { wallet_address: walletAddress });
      setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [walletAddress, api]);

  // Record a subscription payment (after PaymentFlow completes)
  const recordPayment = useCallback(async (txHash, amount) => {
    try {
      await axios.post(`${api}/subscription/payment`, {
        wallet_address: walletAddress,
        tx_hash: txHash,
        amount,
      });
      await loadSubscription();
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }, [walletAddress, api, loadSubscription]);

  return {
    subscription,
    loading,
    isActive: subscription?.status === 'active',
    nextPaymentDate: subscription?.next_payment_date,
    subscribe,
    cancel,
    recordPayment,
    refresh: loadSubscription,
  };
}
