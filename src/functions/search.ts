import { qlFn, parseType } from './index.ts';

export function score(val: number, withAs = true) {
  return qlFn.create(`search::score(${val})${withAs ? ' AS score' : ''}`);
}

/**
 * search::highlight(string, string, number) -> string | string[]
 example: 
 SELECT id, search::highlight('<b>', '</b>', 1) AS title
  FROM book WHERE title @1@ 'rust web';
[
  {
    id: book:1,
    title: [ '<b>Rust</b> <b>Web</b> Programming' ]
  }
]
 */
export function highlight(input: string, input2: string, v: number) {
  return qlFn.create(`search::highlight(${parseType(input)}, ${parseType(input2)}, ${v})`);
}


/**
 * search::offsets(number) -> object
  example:
  SELECT id, title, search::offsets(1) AS title_offsets
  FROM book WHERE title @1@ 'rust web';
[
  {
    id: book:1,
    title: [ 'Rust Web Programming' ],
    title_offsets: {
      0: [
        { e: 4, s: 0 },
        { e: 8, s: 5 }
      ]
    }
  }
]
 */
export function offsets(num: number) {
  return qlFn.create(`search::offsets(${num})`);
}


export const search = {
  score,
  highlight,
  offsets
}