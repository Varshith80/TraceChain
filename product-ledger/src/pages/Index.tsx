import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, QrCode, CheckCircle, Factory, Store, ShoppingBag } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="container-app flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-semibold">TraceChain</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button asChild>
            <Link to="/auth?mode=signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container-app py-20 text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Blockchain-Powered
          <span className="block text-primary">Supply Chain Traceability</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Verify product authenticity with immutable blockchain records. From manufacturer to consumer, every step is traceable and tamper-proof.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link to="/auth?mode=signup">
              <QrCode className="mr-2 h-5 w-5" />
              Start Verifying
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/verify">Scan a QR Code</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container-app pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <Factory className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Manufacturers</h3>
              <p className="text-muted-foreground">
                Create batch QR codes, track shipments, and commit messages to the blockchain.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Store className="mb-4 h-10 w-10 text-[hsl(262_72%_50%)]" />
              <h3 className="mb-2 text-lg font-semibold">Retailers</h3>
              <p className="text-muted-foreground">
                Receive shipments, update inventory status, and maintain chain of custody.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <ShoppingBag className="mb-4 h-10 w-10 text-[hsl(200_80%_50%)]" />
              <h3 className="mb-2 text-lg font-semibold">Consumers</h3>
              <p className="text-muted-foreground">
                Scan products to verify authenticity and view complete supply chain history.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust */}
      <section className="container-app pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
          <CheckCircle className="h-4 w-4" />
          Powered by Hyperledger Fabric
        </div>
      </section>
    </div>
  );
}