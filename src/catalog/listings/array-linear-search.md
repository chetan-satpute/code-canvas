```ts
/*#enter*/ function linearSearch(array: number[], target: number) {
  /*#loop*/ for (let i = 0; i < array.length; i++) {
    /*#compare*/ if (array[i] === target) {
      /*#found*/ return i;
    }
  }

  /*#missing*/ return NaN;
} /*#exit*/
```
