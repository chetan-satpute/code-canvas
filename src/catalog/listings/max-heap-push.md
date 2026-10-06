```ts
/*#enter*/ function push(heap: number[], value: number) {
  /*#append*/ heap.push(value);
  /*#start*/ let index = heap.length - 1;

  /*#loop*/ while (index > 0) {
    /*#parent*/ const parent = Math.floor((index - 1) / 2);

    /*#compare*/ if (heap[index] <= heap[parent]) {
      /*#stop*/ return;
    }

    /*#swap*/ [heap[index], heap[parent]] = [heap[parent], heap[index]];
    /*#climb*/ index = parent;
  }
} /*#exit*/
```
