import React, { useEffect } from "react";
import { useRouter } from "next/router";
import supabase from "../lib/supabaseClient";
import HeroHeader from "@/components/ui/HeroHeader";
import PracticeAreas from "@/components/ui/PracticeAreas";
import Footer from "@/components/ui/Footer";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.replace("/login");
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <main>
        <HeroHeader />

        {/* Hero Section */}
        <section
          className="relative text-center px-6 py-28 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/library.jpg')" }}
          aria-label="Hero"
        >
          <div className="absolute inset-0 bg-gray-900/60" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <p className="text-yellow-400 mb-3 uppercase tracking-wide text-sm">
              Committed to Helping Our Clients Succeed
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Smarter Contracts, Smarter Future
            </h2>
            <p className="mx-auto text-lg text-gray-100">
              Legal Chain democratizes law for individuals, freelancers, SMBs, firms, and enterprises
              with accessible, efficient, AI-powered legal solutions.
            </p>
          </div>
        </section>

        {/* Practice Areas */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-3xl font-bold text-center mb-10 text-yellow-500">
              Our Practice Areas
            </h3>
            <div className="bg-white rounded-xl shadow-md p-6">
              <PracticeAreas />
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}
