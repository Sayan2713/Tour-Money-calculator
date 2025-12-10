import React from 'react';


export default function CopyrightPage() {
return (
<div className="min-h-screen bg-gray-50 p-6">
<div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
<header className="mb-6">
<h1 className="text-2xl font-bold">Copyright</h1>
<p className="text-sm text-gray-600 mt-1">Last updated: December 11, 2025</p>
</header>


<section className="prose prose-sm text-gray-700">
<p>
All content included in this application — text, images, user interface, code, and visuals — is the
property of the application owner unless otherwise noted. The content is protected by applicable copyright
and intellectual property laws.
</p>


<h3>License</h3>
<p>
You may view and interact with the content for personal, non-commercial use only. Reproduction,
distribution, modification, or republication of any material from this application for any public or
commercial purpose is strictly prohibited without prior written permission.
</p>


<h3>Third‑party Materials</h3>
<p>
Some materials (icons, libraries, fonts) may be used under third‑party licenses. Where required, such
attributions are included alongside the respective resources or in a dedicated third‑party licenses file.
</p>


<h3>Reporting Infringement</h3>
<p>
If you believe any content infringes your copyright, please contact us with a detailed notice including
the infringing material, proof of ownership, and your contact information.
</p>
</section>


<footer className="mt-8 border-t pt-4 text-sm text-gray-500">
© {new Date().getFullYear()} Trip Split App. All rights reserved.
</footer>
</div>
</div>
);
}