//index.js
const app = getApp()

Page({
  data: {
    logged: false,
    avatarUrl: '../../images/user-unlogin.png',
    userInfo: {},
    birthman: '',
    birthday: '1990-01-01',
    imgUrl: '',
  },
  // 寿星姓名
  birthmanChange(e) {
    this.setData({ birthman: e.detail.value });
  },
  // 选择生日
  birthdayChange(e) {
    this.setData({ birthday: e.detail.value });
  },
  onLoad: function () {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }

    this.getSetting();
  },
  getSetting: function () {
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({ userInfo: res.userInfo })
            }
          })
        }
      }
    })
  },
  onGetUserInfo: function (e) {
    if (!this.data.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
      this.onGetOpenid(e.detail.userInfo);
    }
  },
  onGetOpenid: function (userInfo) {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: { ...userInfo },
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.setStorageSync('openid', res.result.openid);
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
      }
    })
  },
  

  // 上传图片
  doUpload: function () {
    const _this = this;
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        let imageNo = "";  //订单号
        //6位随机数，用以加在时间戳后面。
        for (let i = 0; i < 6; i++) { imageNo += Math.floor(Math.random() * 10); }
        imageNo = new Date().getTime() + imageNo;  //时间戳，用来生成订单号。

        // 上传图片
        const cloudPath = 'photo/' + imageNo + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            _this.setData({ imgUrl: res.fileID })
            // wx.navigateTo({ url: '../birthday/index' })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },
  // 创建新的祝福
  createRibution: function () {
    const openid = wx.getStorageSync('openid');
    const { birthman, birthday, imgUrl } = this.data;
    console.log(openid);

    if (!birthman) return wx.showToast({ icon: 'none', title: '请输入寿星姓名', })
    if (!birthday) return wx.showToast({ icon: 'none', title: '请选额寿星生日', })
    if (!imgUrl) return wx.showToast({ icon: 'none', title: '请上传寿星照片', })


    const db = wx.cloud.database()
    db.collection('birthday').add({
      data: { birthman, birthday, imgUrl },
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        wx.showToast({ title: '添加成功' })
        console.log('[数据库] [新增生日募捐] 成功，记录 _id: ', res._id)

        wx.navigateTo({ url: '../birthday/index?birthdayId=' + res._id })
      },
      fail: err => {
        wx.showToast({ icon: 'none', title: '提交失败' })
        console.error('[数据库] [新增生日募捐] 失败：', err)
      }
    })
  }

})
