# sol_transfer ![twitter](https://img.shields.io/twitter/follow/0xNaiXi?style=social)

sol链批量转账 by 0xNaiXi
# 展示
![image](https://github.com/okeyzero/sol_transfer/assets/48344256/d5566d8b-cd17-417f-a5a6-f9d8625d1918)

# 环境
node Js (https://nodejs.org/)

# 使用方法
1,下载本项目

2,在本项目目录下 打开控制台

输入
```
npm install
```
3,填写 .env 文件中的 内容 你的私钥 ，单个地址转账 金额 (单位/sol)

4,在myAddress.txt 文件中 填上你的 要分发的地址

5,在控制台 执行
```
node sol_transfer.js
```

# 提示
分发的话 这样分发就行了(cointool 是收手续费的)，也不麻烦。对于多对一转账 可以使用  cointool(https://cointool.app/batchCollection/sol) 可以免费用，记得转账时候的金额别设置错了
