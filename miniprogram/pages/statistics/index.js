//index.js
const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    userInfo: {},
    logged: false,
    listData: []
  },

  goPage(e) {
    wx.navigateTo({ url: '/pages/birthday/index?birthdayId=' + e.target.dataset.birthdayid });
  },
  onLoad: function () {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    this.getSetting();
    this.onQuery()
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
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
      }
    })
  },
  // 重组数据
  regroupData: function (data) {
    let listData = [];

    for (const item of data) {
      const { birthdayId, birthday, birthman, donator, money } = item;

      let title = `${birthday} ${birthman}`;
      let donateData = { donator, money };
      let index = listData.findIndex(row => row.birthdayId == birthdayId);
      if (index != -1) {
        listData[index].donateData.push(donateData);
      } else {
        let param = {
          birthdayId,
          title,
          donateData: [donateData]
        }
        listData.push(param);
      }
    }
    console.log(listData);
    this.setData({ listData })
  },

  // 查询所有生日信息
  onQuery: function () {

    db.collection('donation').get({
      success: res => {
        this.regroupData(res.data)
        console.log('[数据库] [查询记录] 成功: ', res)
      },
      fail: err => {
        wx.showToast({ icon: 'none', title: '查询记录失败' })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },

})
