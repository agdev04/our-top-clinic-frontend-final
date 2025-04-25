import { Button } from "@/components/ui/button";
import { SignUpButton } from "@clerk/clerk-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#CBFBF1] px-4">
      <h1 className="text-4xl font-bold text-[#134E4A] mb-4 text-center">
        Welcome to Our Top Clinic
      </h1>
      <p className="text-lg text-[#0F766E] mb-8 max-w-xl text-center">
        Your one-stop platform for connecting with top healthcare providers,
        managing appointments, and accessing quality medical services. Join us
        to experience seamless healthcare management.
      </p>
      <SignUpButton mode="modal">
        <Button className="bg-[#14B8A6] hover:bg-[#0F9D8B] text-white px-6 py-3 rounded-md text-lg">
          Get Started
        </Button>
      </SignUpButton>
    </div>
  );
}
