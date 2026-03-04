/**
 * @file 优先级队列实现
 * @description 基于最大堆的优先级队列，支持按优先级和入队时间排序
 * @module services/PriorityQueue
 */

/**
 * 任务优先级常量
 * @description 定义任务的优先级级别，数值越大优先级越高
 * @type {Object}
 * @property {number} LOW - 低优先级（0）
 * @property {number} NORMAL - 普通优先级（1）
 * @property {number} HIGH - 高优先级（2）
 * @property {number} CRITICAL - 关键优先级（3）
 */
const PRIORITY = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3
}

/**
 * 优先级队列类
 * @description 使用最大堆实现的优先级队列，相同优先级时按入队时间排序（先进先出）
 * @class
 * @example
 * const queue = new PriorityQueue()
 * queue.enqueue('task1', PRIORITY.HIGH)
 * queue.enqueue('task2', PRIORITY.LOW)
 * console.log(queue.dequeue()) // { item: 'task1', priority: 2, timestamp: ... }
 */
class PriorityQueue {
  /**
   * 创建优先级队列实例
   * @description 初始化空堆数组
   */
  constructor() {
    /**
     * 堆数组
     * @type {Array<{item: any, priority: number, timestamp: number}>}
     */
    this.heap = []
  }

  /**
   * 入队操作
   * @description 将元素按指定优先级加入队列，自动维护堆性质
   * @param {*} item - 要入队的元素
   * @param {number} [priority=PRIORITY.NORMAL] - 优先级，默认为普通优先级
   * @returns {Object} 包含元素、优先级和时间戳的节点对象
   */
  enqueue(item, priority = PRIORITY.NORMAL) {
    const node = { item, priority, timestamp: Date.now() }
    this.heap.push(node)
    this.bubbleUp(this.heap.length - 1)
    return node
  }

  /**
   * 出队操作
   * @description 移除并返回优先级最高的元素
   * @returns {Object|null} 堆顶节点对象，队列为空时返回 null
   */
  dequeue() {
    if (this.isEmpty()) return null
    if (this.heap.length === 1) return this.heap.pop()

    const top = this.heap[0]
    this.heap[0] = this.heap.pop()
    this.bubbleDown(0)
    return top
  }

  /**
   * 查看堆顶元素
   * @description 返回优先级最高的元素但不移除
   * @returns {Object|null} 堆顶节点对象，队列为空时返回 null
   */
  peek() {
    return this.heap[0] || null
  }

  /**
   * 检查队列是否为空
   * @returns {boolean} 队列为空时返回 true
   */
  isEmpty() {
    return this.heap.length === 0
  }

  /**
   * 获取队列大小
   * @returns {number} 队列中元素的数量
   */
  size() {
    return this.heap.length
  }

  /**
   * 清空队列
   * @description 移除队列中的所有元素
   */
  clear() {
    this.heap = []
  }

  /**
   * 按条件移除元素
   * @description 根据谓词函数移除匹配的第一个元素，并重新堆化
   * @param {Function} predicate - 判断函数，接收节点 item 作为参数
   */
  remove(predicate) {
    const index = this.heap.findIndex(node => predicate(node.item))
    if (index !== -1) {
      this.heap.splice(index, 1)
      this.heapify()
    }
  }

  /**
   * 上浮操作
   * @description 将指定位置的元素向上移动以维护堆性质
   * @param {number} index - 要上浮的元素索引
   * @private
   */
  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.compare(index, parentIndex) <= 0) break
      this.swap(index, parentIndex)
      index = parentIndex
    }
  }

  /**
   * 下沉操作
   * @description 将指定位置的元素向下移动以维护堆性质
   * @param {number} index - 要下沉的元素索引
   * @private
   */
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

  /**
   * 比较两个节点
   * @description 比较优先级，优先级相同时按时间戳排序（先入队的优先）
   * @param {number} i - 第一个节点的索引
   * @param {number} j - 第二个节点的索引
   * @returns {number} 正数表示 i 优先级更高
   * @private
   */
  compare(i, j) {
    const a = this.heap[i]
    const b = this.heap[j]
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    return b.timestamp - a.timestamp
  }

  /**
   * 交换两个节点
   * @param {number} i - 第一个节点的索引
   * @param {number} j - 第二个节点的索引
   * @private
   */
  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]]
  }

  /**
   * 堆化操作
   * @description 从最后一个非叶子节点开始，自底向上调整堆
   * @private
   */
  heapify() {
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.bubbleDown(i)
    }
  }
}

export { PriorityQueue, PRIORITY }
export default PriorityQueue
