import { opts, run, vars } from './mod.ts'

console.log('args:',Deno.args)
console.log('opts:',opts)
console.log('vars:',vars)

run()