// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const onUpdate = function (updateid, userinfo) {
  console.log('修改', userinfo);
  const db = cloud.database()
  db.collection('user').doc(updateid).update({
    data: { ...userinfo }
  }).then(res => {
    console.log(res);

  })
}

const onAdd = function (userinfo) {
  console.log('添加', userinfo);

  const db = cloud.database()
  db.collection('user').add({
    data: { ...userinfo }
  }).then(res => {
    console.log(res);

  })
}

const onQuery = function (openid, userinfo) {
  const db = cloud.database()
  // 查询当前用户所有的 user
  db.collection('user').where({ _openid: openid }).get().then(res => {
    console.log('[数据库] [查询用户] 成功: ', res)
    if (res.data.length > 0) {
      onUpdate(res.data[0]._id, { ...userinfo, _openid: openid })
      return 1
    } else {
      onAdd({ ...userinfo, _openid: openid })
      return 0
    }
  })
}

/**
 * 这个示例将经自动鉴权过的小程序用户 openid 返回给小程序端
 * 
 * event 参数包含小程序端调用传入的 data
 * 
 */
exports.main = (event, context) => {
  console.log(event)
  console.log(context)

  // 可执行其他自定义逻辑
  // console.log 的内容可以在云开发云函数调用日志查看

  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）等信息
  const wxContext = cloud.getWXContext()
  onQuery(wxContext.OPENID, event)


  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    env: wxContext.ENV,
  }
}

