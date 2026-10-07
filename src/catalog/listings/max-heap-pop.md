```ts
/*#enter*/ function pop(heap: number[]): number | undefined {
  /*#emptyCheck*/ if (heap.length === 0) {
    /*#empty*/ return undefined;
  }

  /*#max*/ const max = heap[0];
  /*#last*/ const last = heap.pop()!;

  /*#restCheck*/ if (heap.length > 0) {
    /*#replace*/ heap[0] = last;
    /*#start*/ let index = 0;

    while (true) {
      /*#child*/ let child = 2 * index + 1;

      /*#leafCheck*/ if (child >= heap.length) {
        /*#leaf*/ break;
      }

      /*#pick*/ if (child + 1 < heap.length && heap[child + 1] > heap[child]) {
        /*#right*/ child++;
      }

      /*#compare*/ if (heap[index] >= heap[child]) {
        /*#stop*/ break;
      }

      /*#swap*/ [heap[index], heap[child]] = [heap[child], heap[index]];
      /*#descend*/ index = child;
    }
  }

  /*#return*/ return max;
} /*#exit*/
```
