import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Get the authenticated user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            throw new Error('Unauthorized');
        }

        const { recipient, amount, note } = await req.json();

        if (!recipient || !amount || amount <= 0) {
            throw new Error('Invalid transfer details');
        }

        // [MOCK] In a real app we'd call Stripe/Razorpay/HyperSwitch API here to initiate payout
        // Example: await fetch('https://api.razorpay.com/v1/payouts', { ... })

        // Simulate network processing delay for external gateway
        await new Promise(resolve => setTimeout(resolve, 800));

        // After successful gateway initiation, insert the transaction record
        const { data, error: txError } = await supabaseClient
            .from('transactions')
            .insert([
                {
                    sender_id: user.id,
                    recipient_email: recipient,
                    amount,
                    note,
                    status: 'completed' // Usually 'pending' until webhook confirms
                }
            ])
            .select()
            .single();

        if (txError) {
            // If table doesn't exist yet, we just mock success for the frontend demo
            if (txError.code === '42P01') {
                console.warn("Transactions table does not exist yet. Mocking success.");
                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'Mock transfer successful (Table missing)',
                        transaction: { sender_id: user.id, recipient_email: recipient, amount, note, status: 'completed' }
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                );
            }
            throw txError;
        }

        return new Response(
            JSON.stringify({ success: true, transaction: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
