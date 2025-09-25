import { TransactionForm } from "@/components/TransactionForm";

export default function AddTransaction() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add Transaction</h1>
        <p className="text-muted-foreground mt-2">
          Record a new income or expense transaction to keep track of your finances.
        </p>
      </div>
      
      <TransactionForm />
    </div>
  );
}