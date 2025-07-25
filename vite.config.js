import { resolve, relative, extname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import imagemin from "imagemin";
import imageminJpegtran from "imagemin-jpegtran";
import imageminPngquant from "imagemin-pngquant";
import imageminWebp from "imagemin-webp";
import autoprefixer from "autoprefixer";
import sassGlobImports from "vite-plugin-sass-glob-import";
import glob from "fast-glob";
import injectHTML from "vite-plugin-html-inject";
import FullReload from "vite-plugin-full-reload";

const root = resolve(__dirname, "src");
const publicDir = resolve(__dirname, "public");
const outDir = resolve(__dirname, "build");
const qualityImg = 100;

export default defineConfig(({command}) => {
	if(command === "serve") {
		return {
			base: "./",
			server: {
				host: true,
				port: "8000",
				hot: true,
			},
			root: root,
			publicDir: publicDir,
			css: {
				devSourcemap: true,
			},
			preprocessorOptions: {
				scss: {
					sassOptions: {},
				},
			},
			plugins: [
				injectHTML(),
				FullReload(["./src/*.html", "./src/**/*.html"]),
				sassGlobImports(),
			],
			build: {
				outDir: outDir,
				emptyOutDir: true,
				rollupOptions: {
					input: Object.fromEntries(
						glob.sync(["./src/*.html", "./src/**/*.html", "!./src/components/**"]).map((file) => [
							// This remove `src/` as well as the file extension from each
							// file, so e.g. src/nested/foo.html becomes nested/foo
							relative(__dirname, file.slice(0, file.length - extname(file).length)),

							// This expands the relative paths to absolute paths, so e.g.
							// src/nested/foo becomes /project/src/nested/fo.js
							fileURLToPath(new URL(file, import.meta.url)),
						]),
					),
					output: {
						chunkFileNames: "js/[name]-[hash].js",
						entryFileNames: "js/[name]-[hash].js",

						assetFileNames: ({ name }) => {
							if(/\.(gif|jpe?g|png|svg)$/.test(name ?? "")) {
								return "img/[name]-[hash][extname]";
							};

							if(/\.css$/.test(name ?? "")) {
								return "css/[name]-[hash][extname]";
							};

							// default value
							// ref: https://rollupjs.org/guide/en/#outputassetfilenames
							return "assets/[name]-[hash][extname]";
						},
					},
				},
			},
		};
	} else {
		return {
			base: "build/",
			server: {
				host: true,
				port: "8001",
				hot: true,
			},
			root: root,
			publicDir: publicDir,
			css: {
				devSourcemap: true,
				postcss: {
					plugins: [autoprefixer],
				},
			},
			preprocessorOptions: {
				scss: {
					sassOptions: {},
				},
			},
			plugins: [
				injectHTML(),
				FullReload(["./src/*.html", "./src/**/*.html"]),
				sassGlobImports(),
				ViteImageOptimizer({
					svg: {
						plugins: [
							"removeDoctype",
							"removeXMLProcInst",
							"minifyStyles",
							"sortAttrs",
							"sortDefsChildren",
						],
					},
					png: {
						quality: qualityImg,
					},
					jpeg: {
						quality: qualityImg,
					},
					jpg: {
						quality: qualityImg,
					},
				}),
				{
					...imagemin(["./public/images/**/*.{jpg, png, jpeg}"], {
						destination: "./build/media/images",
						plugins: [
							imageminJpegtran({ quality: qualityImg }),
							imageminPngquant({ quality: qualityImg }),
							imageminWebp({ quality: qualityImg }),
						]
					}),
					apply: "serve",
				},
			],
			build: {
				outDir: outDir,
				emptyOutDir: true,
				minify: true,
				rollupOptions: {
					input: Object.fromEntries(
						glob.sync(["./src/*.html", "./src/**/*.html", "!./src/components/**"]).map((file) => [
							// This remove `src/` as well as the file extension from each
							// file, so e.g. src/nested/foo.html becomes nested/foo
							relative(__dirname, file.slice(0, file.length - extname(file).length)),

							// This expands the relative paths to absolute paths, so e.g.
							// src/nested/foo becomes /project/src/nested/fo.js
							fileURLToPath(new URL(file, import.meta.url)),
						]),
					),
					output: {
						chunkFileNames: "js/[name]-[hash].js",
						entryFileNames: "js/[name]-[hash].js",

						assetFileNames: ({ name }) => {
							if(/\.(gif|jpe?g|png|svg)$/.test(name ?? "")) {
								return "img/[name]-[hash][extname]";
							};

							if(/\.css$/.test(name ?? "")) {
								return "css/[name]-[hash][extname]";
							};

							// default value
							// ref: https://rollupjs.org/guide/en/#outputassetfilenames
							return "assets/[name]-[hash][extname]";
						},
					},
				},
			},
		};
	};
});
