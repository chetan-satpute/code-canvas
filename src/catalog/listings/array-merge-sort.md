```ts
/*#enter*/ function mergeSort(array: number[]) {
  /*#base*/ if (array.length <= 1) {
    /*#sorted*/ return;
  }

  /*#mid*/ const mid = Math.floor(array.length / 2);
  /*#left*/ const left = array.slice(0, mid);
  /*#right*/ const right = array.slice(mid);

  /*#sortLeft*/ mergeSort(left);
  /*#sortRight*/ mergeSort(right);
  /*#merge*/ merge(array, left, right);
} /*#exit*/

/*#mergeEnter*/ function merge(
  array: number[],
  left: number[],
  right: number[],
) {
  /*#startLeft*/ let i = 0;
  /*#startRight*/ let j = 0;
  /*#startArray*/ let k = 0;

  /*#loop*/ while (i < left.length && j < right.length) {
    /*#compare*/ if (left[i] <= right[j]) {
      /*#takeLeft*/ array[k] = left[i];
      /*#nextLeft*/ i++;
    } else {
      /*#takeRight*/ array[k] = right[j];
      /*#nextRight*/ j++;
    }

    /*#nextSlot*/ k++;
  }

  /*#drainLeft*/ while (i < left.length) {
    /*#drainLeftTake*/ array[k] = left[i];
    /*#drainLeftNext*/ i++;
    /*#drainLeftSlot*/ k++;
  }

  /*#drainRight*/ while (j < right.length) {
    /*#drainRightTake*/ array[k] = right[j];
    /*#drainRightNext*/ j++;
    /*#drainRightSlot*/ k++;
  }
} /*#mergeExit*/
```
