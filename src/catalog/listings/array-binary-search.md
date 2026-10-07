```ts
// `array` has to be sorted in ascending order.
/*#enter*/ function binarySearch(array: number[], target: number) {
  /*#low*/ let low = 0;
  /*#high*/ let high = array.length - 1;

  /*#loop*/ while (low <= high) {
    /*#mid*/ const mid = Math.floor((low + high) / 2);

    /*#compare*/ if (array[mid] === target) {
      /*#found*/ return mid;
    }

    /*#less*/ if (array[mid] < target) {
      /*#right*/ low = mid + 1;
    } else {
      /*#left*/ high = mid - 1;
    }
  }

  /*#missing*/ return NaN;
} /*#exit*/
```
