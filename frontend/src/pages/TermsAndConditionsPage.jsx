import React from 'react';


export default function TermsAndConditionsPage() {
return (
<div className="min-h-screen bg-gray-50 p-6">
<div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
<header className="mb-6">
<h1 className="text-2xl font-bold">Terms & Conditions</h1>
<p className="text-sm text-gray-600 mt-1">Please read these terms carefully before using the app.</p>
</header>


<section className="text-gray-700 space-y-4">
<article>
<h3 className="font-semibold">1. Acceptance of Terms</h3>
<p className="text-sm">By using this application you agree to these terms and any updates made to them.</p>
</article>


<article>
<h3 className="font-semibold">2. Use of Service</h3>
<p className="text-sm">You may use the service only for lawful purposes and in accordance with these terms.</p>
<ul className="list-disc list-inside text-sm">
<li>No fraudulent activity.</li>
<li>No abuse or harassment of other users.</li>
<li>Respect third‑party rights and privacy.</li>
</ul>
</article>


<article>
<h3 className="font-semibold">3. Account Responsibility</h3>
<p className="text-sm">You are responsible for the activity that occurs on your account. Keep your
credentials confidential.</p>
</article>


<article>
<h3 className="font-semibold">4. Limitation of Liability</h3>
<p className="text-sm">To the fullest extent permitted by law, the app is provided "as is" and the owners shall not
be liable for any indirect or consequential loss arising from use of the service.</p>
</article>


<article>
<h3 className="font-semibold">5. Modifications</h3>
<p className="text-sm">We may modify these terms at any time; modifications will be effective immediately upon posting.</p>
</article>


<article>
<h3 className="font-semibold">6. Governing Law</h3>
<p className="text-sm">These terms are governed by the laws of the jurisdiction where the company is registered.</p>
</article>
</section>


<footer className="mt-8 border-t pt-4 text-sm text-gray-500">
If you have questions about these terms, contact us
</footer>
</div>
</div>
);
}