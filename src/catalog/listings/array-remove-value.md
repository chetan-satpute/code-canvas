```ts
/*#enter*/ function removeAt(array: number[], index: number) {
  /*#guard*/ if (index < 0 || index >= array.length) {
    /*#outOfRange*/ return;
  }

  /*#loop*/ for (let i = index; i < array.length - 1; i++) {
    /*#shift*/ array[i] = array[i + 1];
  }

  /*#shrink*/ array.length -= 1;
} /*#exit*/
```
