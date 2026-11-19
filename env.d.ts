/// <reference types="astro/client" />

type ENV = {
	lexikome_db: D1Database
};

// use a default runtime configuration (advanced mode).
type Runtime = import("@astrojs/cloudflare").Runtime<ENV>;
declare namespace App {
	interface Locals extends Runtime {}
}