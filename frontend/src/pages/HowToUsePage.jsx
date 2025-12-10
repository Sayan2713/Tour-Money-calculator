import React from 'react';


export default function HowToUsePage() {
return (
<div className="min-h-screen bg-gray-50 p-6">
<div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
<header className="mb-6">
<h1 className="text-2xl font-bold">How to Use This App</h1>
<p className="text-sm text-gray-600 mt-1">Quick, practical guide to get started.</p>
</header>


<section className="space-y-6 text-gray-700">
<article>
<h3 className="font-semibold">1. Create a Trip</h3>
<p className="text-sm">Tap "Create" in the Trips section, give the trip a name and save. Your trip will appear in the
left column list.</p>
</article>


<article>
<h3 className="font-semibold">2. Add Participants</h3>
<p className="text-sm">Add people who are joining the trip. Use the Add button in the Participants card. These names are used
for splitting expenses and calculating settlements.</p>
</article>


<article>
<h3 className="font-semibold">3. Add Expenses</h3>
<p className="text-sm">Open the Add Expense panel, enter a title, amount, choose payer, select a split type and the participants
involved, then save. For percent/exact splits, provide the values per participant.</p>
</article>


<article>
<h3 className="font-semibold">4. Review Settlements</h3>
<p className="text-sm">The Settlement panel shows total spent, per-person share and who owes whom. Deleting a participant will not
change existing expense splits — past expenses are preserved.</p>
</article>


<article>
<h3 className="font-semibold">5. Invite People</h3>
<p className="text-sm">Use the Invite button on a trip to send an email invite. The invite will contain a link to join the trip.</p>
</article>


<article>
<h3 className="font-semibold">Tips</h3>
<ul className="list-disc list-inside text-sm">
<li>Use descriptive titles for expenses so it's easy to identify later.</li>
<li>For shared bills, double-check split percentages/amounts before saving.</li>
<li>Sync frequently to keep all participants up to date.</li>
</ul>
</article>
</section>


<footer className="mt-8 border-t pt-4 text-sm text-gray-500">
Need more help? Contact us
</footer>
</div>
</div>
);
}