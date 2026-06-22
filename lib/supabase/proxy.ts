import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";


export async function updateSession(request: NextRequest){
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies:{
                getAll(){
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet,headers){
                    cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({name,value,options})=>supabaseResponse.cookies.set(name,value,options))
                    Object.entries(headers).forEach(([Key,value])=>supabaseResponse.headers.set(Key,value))
                },
            },
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.
    // IMPORTANT: If you remove getClaims() and you use server-side rendering
    // with the Supabase client, your users may be randomly logged out.

    const {data:{user}} = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname;
    const isLoginPage = pathname === '/';

    if(!user && !isLoginPage){
        console.log("[Proxy] Usuario no autenticado en ruta protegida. Redirigiendo a /");
        const url = request.nextUrl.clone()
        url.pathname = '/'
        const redirectResponse = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie));
        return redirectResponse;
    }

    if (user) {
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('rol(nombre)')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.error("[Proxy] Error en consulta de BD para el usuario", user.id, ":", error);
        }
        
        if (!usuario) {
            console.error("[Proxy] Usuario no encontrado en tabla 'usuarios' o no tiene rol. ID:", user.id);
        }

        if ((!usuario || error) && !isLoginPage) {
            console.log("[Proxy] Falta rol o error en BD. Redirigiendo a / con error de registro.");
            const url = request.nextUrl.clone();
            url.pathname = '/';
            url.searchParams.set('error', 'registry');
            const redirectResponse = NextResponse.redirect(url);
            supabaseResponse.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie));
            return redirectResponse;
        }

        const rolNombre = (usuario?.rol as any)?.nombre;
        console.log(`[Proxy] Rol detectado para usuario ${user.id}:`, rolNombre);

        const rolePaths: Record<string, string> = {
            'estudiante': '/estudiante/dashboard',
            'docente': '/docente/dashboard',
            'admin': '/admin/dashboard',
            'super_admin': '/superadmin/dashboard'
        };

        if (isLoginPage) {
            if (rolNombre && rolePaths[rolNombre]) {
                const targetUrl = rolePaths[rolNombre];
                console.log(`[Proxy] Usuario autenticado ingresando al login (/). Redirigiendo a su dashboard: ${targetUrl}`);
                const url = request.nextUrl.clone();
                url.pathname = targetUrl;
                const redirectResponse = NextResponse.redirect(url);
                supabaseResponse.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie));
                return redirectResponse;
            } else {
                console.error("[Proxy] Usuario logueado pero sin ruta configurada para su rol:", rolNombre);
            }
        }

        // Protección cruzada estricta
        if (rolNombre && rolePaths[rolNombre]) {
            const expectedPrefix = rolePaths[rolNombre].split('/')[1]; // ej: "estudiante"
            const protectedPrefixes = ['estudiante', 'docente', 'admin', 'superadmin'];
            const currentPrefix = pathname.split('/')[1];
            
            if (protectedPrefixes.includes(currentPrefix) && currentPrefix !== expectedPrefix) {
                console.warn(`[Proxy] ALERTA: Rol '${rolNombre}' intentó acceder a /${currentPrefix}. Bloqueado y redirigido a su panel.`);
                const url = request.nextUrl.clone();
                url.pathname = rolePaths[rolNombre];
                const redirectResponse = NextResponse.redirect(url);
                supabaseResponse.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie));
                return redirectResponse;
            }
        }
    }

  return supabaseResponse;
}