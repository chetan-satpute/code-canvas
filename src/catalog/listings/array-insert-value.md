```ts
/*#enter*/ function insertAt(array: number[], index: number, value: number) {
  /*#guard*/ if (index < 0 || index > array.length) {
    /*#outOfRange*/ return;
  }

  /*#grow*/ array.length += 1;

  /*#loop*/ for (let i = array.length - 1; i > index; i--) {
    /*#shift*/ array[i] = array[i - 1];
  }

  /*#write*/ array[index] = value;
} /*#exit*/
```
