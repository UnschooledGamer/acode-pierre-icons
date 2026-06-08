import { transformFile } from "@swc/core";
import { exec } from "child_process";
import { build } from "esbuild"
import { join } from "path"

const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev")

const start = performance.now();

await build({
  entryPoints: [join("src", "main.js")],
  outfile: "dist/main.js",
  bundle: true,
  format: "iife",

  minify: !isDev,
  
  loader: {
    ".html": "text",
    ".css": "text",
    ".svg": "text",
    ".json": "json",
  },

  plugins: [
    {
      name: "swc",
      setup(build) {
        build.onLoad({ filter: /\.[jt]sx?$/ }, async args => {
          const result = await transformFile(args.path, {
            env: {
              targets: "chrome >= 80",
            },
          });
          return { contents: result.code };
        });
      },
		},
		{
			name: "zip",
			setup(build) {
				build.onEnd(() => {
					// ascii colourful log
					console.log(`[Build] Completed in ${performance.now() - start}ms\n`)

					console.log("[Build] Zipping...")

					exec("node ./scripts/build/pack-zip.js", (err, stout, stderr) => {
						if (err) {
							console.error(err)
							return;
						}

						console.log("[Build]", stout.trim())
					})
				});
			},
    }
  ],
});