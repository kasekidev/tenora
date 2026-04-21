import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  return (
    <div className="container-app py-20 text-center">
      <p className="font-display text-7xl md:text-9xl font-bold gradient-text">404</p>
      <h1 className="mt-3 font-display text-2xl md:text-3xl font-bold">Page introuvable</h1>
      <p className="text-muted-foreground mt-2">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild className="bg-gradient-primary text-primary-foreground">
          <Link to="/"><Home className="size-4" /> Accueil</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/boutique"><Search className="size-4" /> Voir la boutique</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
