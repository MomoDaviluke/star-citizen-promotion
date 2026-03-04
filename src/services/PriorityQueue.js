const PRIORITY = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3
}

class PriorityQueue {
  constructor() {
    this.heap = []
  }
  
  enqueue(item, priority = PRIORITY.NORMAL) {
    const node = { item, priority, timestamp: Date.now() }
    this.heap.push(node)
    this.bubbleUp(this.heap.length - 1)
    return node
  }
  
  dequeue() {
    if (this.isEmpty()) return null
    if (this.heap.length === 1) return this.heap.pop()
    
    const top = this.heap[0]
    this.heap[0] = this.heap.pop()
    this.bubbleDown(0)
    return top
  }
  
  peek() {
    return this.heap[0] || null
  }
  
  isEmpty() {
    return this.heap.length === 0
  }
  
  size() {
    return this.heap.length
  }
  
  clear() {
    this.heap = []
  }
  
  remove(predicate) {
    const index = this.heap.findIndex(node => predicate(node.item))
    if (index !== -1) {
      this.heap.splice(index, 1)
      this.heapify()
    }
  }
  
  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.compare(index, parentIndex) <= 0) break
      this.swap(index, parentIndex)
      index = parentIndex
    }
  }
  
  bubbleDown(index) {
    const length = this.heap.length
    while (true) {
      const leftChild = 2 * index + 1
      const rightChild = 2 * index + 2
      let largest = index
      
      if (leftChild < length && this.compare(leftChild, largest) > 0) {
        largest = leftChild
      }
      if (rightChild < length && this.compare(rightChild, largest) > 0) {
        largest = rightChild
      }
      if (largest === index) break
      
      this.swap(index, largest)
      index = largest
    }
  }
  
  compare(i, j) {
    const a = this.heap[i]
    const b = this.heap[j]
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    return b.timestamp - a.timestamp
  }
  
  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]]
  }
  
  heapify() {
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.bubbleDown(i)
    }
  }
}

export { PriorityQueue, PRIORITY }
export default PriorityQueue
