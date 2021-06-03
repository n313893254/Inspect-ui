## 运行开发环境

这是启动开发环境需要的东西

```bash
# 安装依赖
yarn install

# 热更新服务将会运行在https://localhost:8005
# 使用你后端服务API的端口地址
API=https://your-server yarn dev
# 或者在.env文件下设置变量
# 在https://localhost:8005可以访问本地运行的前端服务
```

## 其他的编译模式

```bash
./scripts/build-embedded # 用于将UI部署后端服务生成的文件中
./scripts/build-hosted # 用于将UI部署在静态文件网络服务器，如CDN，OSS，然后在后端服务中获取该文件
# 编译输出默认为 dist/
```

# 关于本项目

项目是用[Vue.js](https://vuejs.org/)和[NuxtJS](https://nuxtjs.org/)构建的Rancher APIs的客户端。通常情况下，构建并打包成一个静态HTML/CSS/JS文件的文件夹，之后部署在对应的后端服务器中。

登录后的用户获得所有k8s类型、命名空间和操作的访问权限。对于详情页，默认显示从k8s API获取的YAML内容。对于列表页，默认展示 `Tabel`, 每一行的数据也是从k8s API获取。(例如: `kubectl get <type> -o wide`中获取到的数据)。

如果定义了列表页或详情页，便会优先使用自定义视图。列表页可以定义展示的列，展示的样式。编辑页可以定义图形化表单而不是展示默认的YAML编辑视图

## 目录结构

目录结构大多是扁平的，每个顶层的目录都是不同的重要内容（或者只是Nuxt要求的）。

### 如何定制k8s资源视图

这些是你做大部分日常工作的地方，即定制特定k8s资源的呈现方式。

路径 | 用途
-----|---------
config | 配置产品的内容；设置labels，types，cookies和query params等常量。

### 其他

这些大多是标准的Nuxt目录，不需要经常进入。

路径 | 用途
-----|---------
pages | 这里的结构定义了可用的路由，路由匹配到对于路径下的页面

## 路由

路由采用哈希模式，主要使用`c-cluster-product-resource-namespace-id`的模式去构建路由层级，举一个详情页的例子:

```js
{
  name:   `c-cluster-product-resource-namespace-id`,
  params: {
    product:   'redis',
    cluster:   'c-b27h7',
    resource:  'redis.cattle.io.clusteredredis',
    namespace: 'default',
    id:        'c1',
  }
}
```

那么生成的URL为`/#/c/c-b27h7/redis/redis.cattle.io.clusteredredis/default/c1`

## 主页设置

主页默认为`c-cluster-product`, 可以在`@/pages/c/_cluster/index.vue`里修改路由的product参数

License
=======

Copyright (c) 2014-2021 [Rancher Labs, Inc.](http://rancher.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
