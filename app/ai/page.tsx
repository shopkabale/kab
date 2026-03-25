// app/ai/page.tsx
import AiChatWidget from "@/components/AiChatWidget";
import Link from "next/link";

export const metadata = {
  title: "AI Sandbox | Kabale Online",
  description: "Testing environment for the Kabale Online AI Assistant",
};

export default function AITestingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      
      {/* Testing Sandbox UI */}
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center md:p-12">
        <span className="text-6xl block mb-6">🧪</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
          AI Chat Sandbox
        </h1>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Welcome to the testing lab! The AI widget is loaded and floating in the bottom right corner of your screen. 
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left mb-8 shadow-inner">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span>🎯</span> Things to test:
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">1.</span>
              <span><strong>Product Search:</strong> Ask "Do you have laptops?" and watch Algolia inject the products.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">2.</span>
              <span><strong>Memory:</strong> Ask a follow-up question like "What about cheaper ones?"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">3.</span>
              <span><strong>Feedback:</strong> Click the 👍/👎 on an AI reply, then check your Firebase <code className="bg-slate-200 px-1 rounded">ai_conversations</code> collection.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">4.</span>
              <span><strong>Persistence:</strong> Refresh the page and make sure your chat history is still there.</span>
            </li>
          </ul>
        </div>

        <Link 
          href="/" 
          className="inline-block text-slate-500 font-bold hover:text-[#D97706] transition-colors"
        >
          ← Back to main site
        </Link>
      </div>

      {/* This is our widget! Because it has 'fixed' positioning, 
        it will pop out of this container and float on the bottom right.
      */}
      <AiChatWidget />
      
    </div>
  );
}
