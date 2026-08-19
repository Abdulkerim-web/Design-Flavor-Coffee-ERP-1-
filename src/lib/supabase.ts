// Lazily import @supabase/supabase-js to avoid build-time bundling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function makeStub() {
	const stubChannel = () => ({
		on: (_: any, __: any, handler: any) => ({ subscribe: () => {}, // no-op
		}),
	})
	return {
		channel: (_name: string) => ({ on: (_: any, __: any, handler: any) => ({ subscribe: () => {} }) }),
		removeChannel: (_: any) => {},
		from: (_: any) => ({ select: async () => ({ data: [], error: null }), insert: async () => ({ data: [], error: null }), update: async () => ({ data: [], error: null }) }),
	}
}

let supabaseClient: any = makeStub()
if (supabaseUrl && supabaseAnonKey) {
	try {
		const mod = await import("@supabase/supabase-js")
		supabaseClient = mod.createClient(supabaseUrl, supabaseAnonKey)
	} catch (e) {
		// If import fails (missing package), fall back to stub to keep app functional
		console.warn("@supabase/supabase-js not available, using stubbed supabase client.")
		supabaseClient = makeStub()
	}
}

export const supabase = supabaseClient
