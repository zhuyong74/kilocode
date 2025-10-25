# Message Queue 消息队列模块

## 1. 模块概述

Message Queue 模块提供高性能的消息队列服务，支持异步消息处理、任务调度和模块间通信，确保系统的可扩展性和可靠性。

## 2. 文档结构

- `message-queue.md` - 消息队列模块功能概览和使用指南
- `message-queue-architecture.md` - 消息队列模块架构设计文档

## 3. 主要功能

- **消息发布**: 支持消息的发布和广播
- **消息订阅**: 提供灵活的消息订阅机制
- **队列管理**: 管理多个消息队列
- **消息持久化**: 确保消息的可靠传递
- **负载均衡**: 支持消息处理的负载均衡

## 4. 核心组件

- **MessageBroker**: 消息代理
- **QueueManager**: 队列管理器
- **MessageProcessor**: 消息处理器
- **PersistenceLayer**: 持久化层
