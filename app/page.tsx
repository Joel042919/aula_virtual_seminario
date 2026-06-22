import { login } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const errorType = params?.error;
  
  let errorMessage = "";
  if (errorType === "credentials") {
    errorMessage = "Credenciales incorrectas.";
  } else if (errorType === "registry") {
    errorMessage = "Existe un error con su registro.";
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-brand-surface border border-brand-surface-border rounded-3xl p-8 shadow-xl shadow-brand-navy/5 dark:shadow-black/40">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
              Instituto <span className="text-brand-accent">Gamaliel</span>
            </h1>
            <p className="text-brand-slate text-sm">
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary text-sm font-medium text-center">
              {errorMessage}
            </div>
          )}

          <form action={login} className="space-y-6">
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-foreground"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="ejemplo@gamaliel.edu.pe"
                required
                className="w-full px-4 py-3 rounded-xl border border-brand-surface-border bg-background text-foreground placeholder:text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-foreground"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-brand-surface-border bg-background text-foreground placeholder:text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary text-brand-primary-fg hover:opacity-90 font-medium py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-brand-slate">
            <p>¿Problemas para acceder? Contacta a soporte académico.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
