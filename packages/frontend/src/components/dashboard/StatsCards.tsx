import { Card } from "@/components/ui/card";

type Props = {
  totalMarkets?: number;
  totalTrades?: number;
  totalUsers?: number;
  totalVolumeEth?: string;
  loading?: boolean;
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-2xl font-semibold">{value}</span>
  </div>
);

const StatsCards = ({ totalMarkets, totalTrades, totalUsers, totalVolumeEth, loading }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">{loading ? <div className="h-6 w-24 bg-muted rounded" /> : <Stat label="Markets" value={totalMarkets ?? 0} />}</Card>
      <Card className="p-4">{loading ? <div className="h-6 w-24 bg-muted rounded" /> : <Stat label="Trades" value={totalTrades ?? 0} />}</Card>
      <Card className="p-4">{loading ? <div className="h-6 w-24 bg-muted rounded" /> : <Stat label="Users" value={totalUsers ?? 0} />}</Card>
      <Card className="p-4">{loading ? <div className="h-6 w-24 bg-muted rounded" /> : <Stat label="Volume (ETH)" value={totalVolumeEth ?? "0"} />}</Card>
    </div>
  );
};

export default StatsCards;


