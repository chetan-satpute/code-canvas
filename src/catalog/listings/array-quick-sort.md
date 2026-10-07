```ts
/*#enter*/ function quickSort(
  array: number[],
  low = 0,
  high = array.length - 1,
) {
  /*#base*/ if (low >= high) {
    /*#sorted*/ return;
  }

  /*#partition*/ const p = partition(array, low, high);
  /*#sortLeft*/ quickSort(array, low, p - 1);
  /*#sortRight*/ quickSort(array, p + 1, high);
} /*#exit*/

/*#partitionEnter*/ function partition(
  array: number[],
  low: number,
  high: number,
) {
  /*#pivot*/ const pivot = array[high];
  /*#start*/ let i = low;

  /*#loop*/ for (let j = low; j < high; j++) {
    /*#compare*/ if (array[j] <= pivot) {
      /*#swap*/ [array[i], array[j]] = [array[j], array[i]];
      /*#next*/ i++;
    }
  }

  /*#placePivot*/ [array[i], array[high]] = [array[high], array[i]];
  /*#returnIndex*/ return i;
} /*#partitionExit*/
```
