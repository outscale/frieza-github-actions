import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const plugins = [typescript(), nodeResolve({ preferBuiltins: true }), commonjs()]

export default [
  {
    input: 'src/main.ts',
    output: { esModule: true, file: 'dist/index.js', format: 'es', sourcemap: true },
    plugins
  },
  {
    input: 'src/post.ts',
    output: { esModule: true, file: 'dist/post.js', format: 'es', sourcemap: true },
    plugins
  }
]
