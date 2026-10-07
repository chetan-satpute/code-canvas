```ts
/*#enter*/ function remove(list: LinkedList, target: number) {
  /*#start*/ let node = list.head;
  /*#noPrevious*/ let previous: LinkedListNode | null = null;

  /*#search*/ while (node !== null && node.value !== target) {
    /*#setPrevious*/ previous = node;
    /*#advance*/ node = node.next;
  }

  /*#missingCheck*/ if (node === null) {
    /*#missing*/ return;
  }

  /*#headCheck*/ if (previous === null) {
    /*#setHead*/ list.head = node.next;
  } else {
    /*#setNext*/ previous.next = node.next;
  }
} /*#exit*/
```
