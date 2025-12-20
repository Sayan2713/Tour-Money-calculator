import React from 'react';
import PageContainer from '../components/PageContainer';
import api from '../api';

const SubscriptionPage = () => {
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '₹501',
      period: '/ month',
      features: ['Trip Bar Graphs', 'Expense Tracking', 'Email Support'],
      color: 'bg-blue-100 border-blue-500',
      btnColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'advance',
      name: 'Advance',
      price: '₹1001',
      period: '/ month',
      features: ['Everything in Basic', 'Line Graphs', 'Detailed Analytics'],
      color: 'bg-purple-100 border-purple-500',
      btnColor: 'bg-purple-600 hover:bg-purple-700',
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '₹2101',
      period: '/ month',
      features: [
        'All Graphs (Bar + Line)',
        'Individual Person Stats',
        'Priority Support',
        'Ad-free Experience'
      ],
      color: 'bg-yellow-100 border-yellow-500',
      btnColor: 'bg-yellow-600 hover:bg-yellow-700'
    }
  ];

  const handleSubscribe = async (planId) => {
    try {
      const { data: order } = await api.post('/payments/create-order', {
        planId
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'TripSplit',
        description: 'Subscription Payment',
        order_id: order.id,

        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        },

        handler: async function (response) {
          await api.post('/payments/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planId
          });

          alert('Payment successful! Subscription activated.');
          window.location.href = '/';
        },

        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Unable to initiate payment');
    }
  };

  return (
    <PageContainer title="Upgrade Your Plan">
      <div className="text-center mb-10">
        <p className="text-gray-600">
          Unlock powerful insights and manage your trips like a pro.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative p-8 rounded-2xl border-2 shadow-lg flex flex-col ${plan.color} transition-transform hover:-translate-y-2`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                MOST POPULAR
              </div>
            )}

            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {plan.name}
            </h3>

            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-extrabold text-gray-900">
                {plan.price}
              </span>
              <span className="text-gray-600 ml-1">{plan.period}</span>
            </div>

            <ul className="flex-1 space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              className={`w-full py-3 rounded-xl text-white font-bold shadow-md transition-colors ${plan.btnColor}`}
            >
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>
    </PageContainer>
  );
};

export default SubscriptionPage;
