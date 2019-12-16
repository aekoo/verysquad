//index.js
const app = getApp()
const db = wx.cloud.database()


Page({
  data: {
    userInfo: {},
    logged: false,
    status: true,
    showPopups: false,
    birthman: '--',
    money: ''
  },
  scitch() {
    this.setData({ showPopups: false })
  },

  setMoney(e) {
    this.setData({ money: e.detail.value });
  },
  setMoney1() {
    this.setData({ money: 1000 });
  },
  setMoney2() {
    this.setData({ money: 2000 });
  },
  audioChange() {
    if (this.data.status) {
      this.innerAudioContext.pause()
      this.innerAudioContext.onPause(() => {
        this.setData({ status: false })
      })
    } else {
      this.innerAudioContext.play()
      this.innerAudioContext.onPlay(() => {
        this.setData({ status: true })
      })
    }
  },
  onReady: function () {
    this.innerAudioContext = wx.createInnerAudioContext()
    // this.innerAudioContext.src = encodeURI('http://antiserver.kuwo.cn/anti.s?rid=MUSIC_54761734&response=res&format=mp3|aac&type=convert_url&br=128kmp3&agent=iPhone&callback=getlink&jpcallback=getlink.mp3')
    this.innerAudioContext.src = encodeURI('cloud://prod-du7tj.7072-prod-du7tj-1300914810/audio/birthday.mp3')
    this.innerAudioContext.autoplay = true
    this.innerAudioContext.loop = true
  },
  onUnload: function () {
    this.innerAudioContext.destroy()
  },
  onLoad: function (props) {
    const { birthdayId } = props;
    app.globalData.birthdayId = birthdayId;
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    this.getSetting();
    this.onQuery(birthdayId)
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

  // 查询祝福信息
  onQuery: function (birthdayId) {

    db.collection('birthday').where({
      _id: birthdayId
    }).get({
      success: res => {
        const { birthdayId, birthday, birthman } = res.data[0];
        this.setData({ showPopups: true, birthdayId, birthday, birthman })
        // this.audioChange();
        console.log('[数据库] [查询记录] 成功: ', res)
      },
      fail: err => {
        wx.showToast({ icon: 'none', title: '查询记录失败' })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },
  // 确认捐赠
  confirmDonate: function () {
    const { userInfo: { nickName }, birthdayId, birthday, birthman, money } = this.data;
    if (!money) return wx.showToast({ icon: 'none', title: '请选择或输入捐赠金额', })

    db.collection('donation').where({
      birthdayId
    }).get({
      success: res => {
        if (res.data.length > 0) {
          wx.showToast({ icon: 'none', title: '您已提交过,请勿重复提交！' })
        } else {

          db.collection('donation').add({
            data: {
              birthdayId,
              birthday,
              birthman,
              donator: nickName,
              money
            },
            success: res => {
              wx.showToast({ icon: 'none', title: '提交成功，请将意向金转账给非同一班财务童鞋', })
              console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
            },
            fail: err => {
              wx.showToast({
                icon: 'none',
                title: '新增记录失败'
              })
              console.error('[数据库] [新增记录] 失败：', err)
            }
          })

        }
        console.log('[数据库] [查询记录] 成功: ', res)
      },
      fail: err => {
        wx.showToast({ icon: 'none', title: '查询记录失败' })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })



  },

  onShareAppMessage(options) {
    console.log(app.globalData.birthdayId);
    
    return {
      title: "非同一班公益委员会祝你生日快乐~",
      path: '/pages/birthday/index?birthdayId=' + app.globalData.birthdayId,
      imageUrl: '../../images/share.png',
    }
  }
})
