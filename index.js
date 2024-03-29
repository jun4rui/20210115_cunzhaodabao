Vue.config.devtools = true;

var mainModel = new Vue({
  el: '#main',
  data: {
    currentTab: 0, //表示当前tab选择第几个，{0:招聘大厅,1:求职大厅}
    currentCompanyShowStatus: 0, //表示当前status选择第几个，{0:全部企业,1:在线企业}
    currentPersonShowStatus: 0, //表示当前status选择第几个，{0:全部企业,1:在线企业}
    searchCompanyKeyword: '', //搜索企业关键字
    searchPersonKeyword: '', //搜索个人关键字
    companyId: null, //企业ID，企业登陆以后会有值
    activityId: null, //展会ID
    activityInfo: null, //展会信息
    activityPattern: null, //展会模式
    activityTime: null, //展会时间
    activityEndTime: null, //展会结束时间
    activityAlreadyStarted: false, //展会是否已经开始
    offlineTimeout: 30, //离线超时时长（分钟）
    activityRecord: null, //展会统计数据
    activityDesc: null, //展会邀请函内容
    activityDescDialog: false, //邀请函显示开关
    companyInfoDialog: false, //企业详情显示开关（可关注企业）
    recruitListDialog: false, //职位列表显示开关（投递简历用）
    recruitInfoDialog: false, //职位详情显示开关
    resumeInfoDialog: false, //简历信息显示开关
    loginDialog: false, //登录提示显示开关
    qrcode2CompanyDialog: false, //和企业聊天的二维码
    qrcode2CompanyUrl: null, //聊天用的企业二维码URl
    companyList: null, //企业列表（包括职位）
    danmuList: [], //弹幕列表
    danmuNum: 50, //每次加载弹幕数量
    reloading: false, //是否在装弹？

    loginMode: null, //用户登陆带入mode参数的值
    personUserInfo: null, //个人用户登陆信息
    enPersonId: null, //加密用户ID
    companyUserInfo: null, //企业用户登陆信息

    currentCompanyInfo: null, //当前企业（信息）
    currentRecruitList: null, //当前（企业）职位列表
    currentRecruitChecked: '', //当前职位选择了谁
    currentRecruitInfo: null, //当前职位详情
    currentPositionInfo: null, //当前职位（信息）
    currentResumeInfo: null, //当前简历

    jobSeekerList: null, //求职责列表
    currentRegion: '', //当前地区（默认空字符串表示全部

    /*聊天相关属性*/
    offlineConversations: [], //离线会话
    sendMessageList: [], //自己发送的信息列表
    messageRecordNum: 0, //新消息记录数
    chatMessage: '', //聊天信息
    receiveMessageList: [], //收到信息列表
    conversations: [], //会话列表1是签到模式
    //目标用户名
    targetUser: {
      name: '',
      id: '',
    },
    selfUser: {
      //用户自己的信息
      username: null,
      nickname: null,
      password: null,
    },
    chatInfo: null, //记录JM必要的信息
    chatFilterStr: '', //“入场求职者”过滤关键字（字符串）
    tabName: 'job', //tab名称
    oldUnreadMsgCount: 0 /*~聊天相关属性*/,

    /*离线模式相关*/
    afkMode: false, //离线模式状态
    afkMessage: '', //离线模式自动回复信息
    afkCustomizeMessage: '', //自定义离线消息
    afkTime: 0, //设定离开的时间（毫秒数）
    afkComeMessage: [], //AFK后发过来的消息列表（等待发送自动回复信息用的）
    /*～离线模式相关*/
  },
  computed: {
    //获得未读消息总数
    unreadMsgCount: function() {
      var _unreadMsgCount = 0;
      var _unreadList = [];
      var _diff = 0; //消息相差
      var _offMsg = this.offlineConversations.map(function(item) {
        return {
          key: item.key,
          unread_msg_count: item.unread_msg_count,
          from_username: item.from_username,
          mtime: null,
        };
      });
      var _onMsg = this.conversations.map(function(item) {
        return {
          key: item.key,
          unread_msg_count: item.unread_msg_count,
          from_username: item.username,
          nickName: item.nickName,
          mtime: item.mtime,
          afkKey:
            item.username.toString() + '_' + item.unread_msg_count.toString(), //因为过来同一个消息发送人只有一条记录，这样离线自动回复会导致只自动回复一次。如果同一个人发送多次也仅仅只有一条记录，所以将发送人和未读消息数合在一起作为独特的KEY，用来保证同一个人每次发送都会被记录下来
          responseStatus: false, //回复状态
        };
      });

      //判断在线消息中需要自动回复的
      _onMsg.map(function(item) {
        //在设置为离线的时候，将时间大于afkTime的未读消息推送到afkComMessage去
        // console.log('检测自动回复：', mainModel.afkMode, item.mtime, mainModel.afkTime, item.unread_msg_count);
        if (
          mainModel.afkMode &&
          item.mtime > mainModel.afkTime &&
          item.unread_msg_count > 0
        ) {
          // console.log('自动回复：', item);
          if (!_.find(mainModel.afkComeMessage, {afkKey: item.afkKey})) {
            mainModel.afkComeMessage.push(item);
          }
        }
      });
      //调用离线消息自动回复的方法
      if (this.afkMode) {
        this.autoResponse();
      }

      _unreadList = _.uniqBy(_unreadList.concat(_onMsg, _offMsg), 'key');
      // console.log('_unreadList:', _unreadList);
      _unreadList.map(function(item) {
        _unreadMsgCount += item.unread_msg_count;
      });

      _diff = _unreadMsgCount - this.oldUnreadMsgCount;

      // console.log('unreadMsgCount:', _unreadMsgCount, _unreadList, _offMsg, _onMsg, '相差：', _unreadMsgCount - this.oldUnreadMsgCount);
      if (_diff > 0) {
        this.$message.success('您收到' + _diff + '条新消息，请注意查收。');
      }
      this.oldUnreadMsgCount = _unreadMsgCount;
      return _unreadMsgCount;
    }, //获取target的id
    targetId: function() {
      return this.targetUser.id.replace(/^[c|p]/g, '').replace(/test$/g, '');
    } /*聊天相关*/,
    currentMsg: function() {
      //如果没有当前用户名，就返回空数组
      console.log(
        `Computed 当前用户是 ${this.targetUser.name} ${this.targetUser.id}`,
      );
      if (this.targetUser.id === '') {
        console.log(
          `currentMsg 返回空数组，因为没有当前目标用户名 ${this.targetUser.id}`,
        );
        return [];
      }

      //过滤离线信息
      let _offline = [];
      //外层循环，找到对应form_uesr的名字的对话
      for (let item of this.offlineConversations) {
        if (item.from_username === this.targetUser.id) {
          //内层循环，将所有和该用户的对话push到_offline中
          _offline = item.msgs.map(function(msgItem, index) {
            //console.log(`${msgItem.content.from_name} ${index}`);
            return {
              from_username: msgItem.content.from_name,
              from_id: msgItem.content.from_id,
              target_username: msgItem.content.target_name,
              message: msgItem.content.msg_body.text,
              extras: msgItem.content.msg_body.extras
                ? msgItem.content.msg_body.extras
                : '',
              timestamp: msgItem.content.create_time,
            };
          });
        }
      }

      //过滤收到信息
      let _recMsg = [];
      //外层循环，找到对应form_uesr的名字的对话
      for (let item of this.receiveMessageList) {
        if (item.from_username === this.targetUser.id) {
          console.log(`_recMsg有`, item.content.from_name);
          _recMsg.push({
            from_username: item.content.from_name,
            from_id: item.content.from_id,
            target_username: item.content.target_name,
            message: item.content.msg_body.text,
            extras: item.content.msg_body.extras
              ? item.content.msg_body.extras
              : '',
            timestamp: item.content.create_time,
          });
        }
      }
      //发送的消息
      let _sendMsg = [];
      /*_sendMsg     = this.sendMessageList.map(function(msgItem, index) {
       if (msgItem.target_username === this.targetUser.name) {
       console.log(`_sendMsg有`, index, msgItem.from_username);
       return {
       from_username:   msgItem.from_username,
       target_username: msgItem.target_username,
       message:         msgItem.message,
       timestamp:       msgItem.timestamp
       };
       }
       }.bind(this));*/
      this.sendMessageList.map(
        function(msgItem, index) {
          if (msgItem.target_username === this.targetUser.name) {
            console.log(`_sendMsg有`, index, msgItem.from_username);
            _sendMsg.push({
              from_username: msgItem.from_username,
              target_username: msgItem.target_username,
              message: msgItem.message,
              extras: msgItem.extras ? msgItem.extras : '',
              timestamp: msgItem.timestamp,
            });
          }
        }.bind(this),
      );
      console.log(`currentMsg`, _recMsg.length, _recMsg);

      _offline = _.orderBy(_offline, ['timestamp'], ['asc']);
      let _newMsg = _.concat(_recMsg, _sendMsg);
      _newMsg = _.orderBy(_newMsg, ['timestamp'], ['asc']);

      let _msg = _.concat(_offline, _newMsg);
      //合并数据
      return _msg;
    },
    chatDiaglogVisible: function() {
      return this.targetUser.id !== '';
    },
    /*~聊天相关*/
  },
  methods: {
    //检查登录状态
    checkLoginStatus: function() {
      console.info('Enter checkLoginStatus.');
      //check personUserInfo branch
      if (this.personUserInfo) {
        $.post(
          'http://www.hnrcsc.com/web/seekjob/video!personLogin.action',
          function(response) {
            if (response.map.status !== '00') {
              this.$notify.error({
                title: '错误',
                dangerouslyUseHTMLString: true,
                duration: 0,
                message: '您的登录已失效，请重新登录湖南人才网.',
              });
              this.personUserInfo = null;
            }
          }.bind(this),
        );
      }
      //check companyUserInfo branch
      if (this.companyUserInfo) {
        $.post(
          'http://www.hnrcsc.com/web/recruit/login!checkLogin.action',
          function(response) {
            if (response.map.status !== '00') {
              this.$notify.error({
                title: '错误',
                dangerouslyUseHTMLString: true,
                duration: 0,
                message: '您的登录已失效，请重新登录湖南人才网.',
              });
              this.companyUserInfo = null;
            }
          }.bind(this),
        );
      }
    },
    //自动回复消息
    autoResponse: function() {
      if (this.afkComeMessage.length === 0) return false;
      this.afkComeMessage.map(
        function(item, index) {
          if (!item.responseStatus) {
            JIM.sendSingleMsg({
              // 'target_username': this.targetUsername,
              target_username: item.from_username,
              content: '离线自动回复：' + mainModel.afkMessage,
              appkey: mainModel.chatInfo.appkey,
            }).onSuccess(
              function(data, msg) {
                console.log('自动回复成功', item, data, msg);

                this.sendMessageList.push({
                  from_username: this.selfUser.nickname,
                  from_id: this.selfUser.id,
                  target_username: this.targetUser.name,
                  message: '离线自动回复：' + mainModel.afkMessage,
                  timestamp: new Date().getTime(),
                });
              }.bind(this),
            );
            this.afkComeMessage[index].responseStatus = true;
            // console.log('auto response:', this.afkComeMessage[index]);
          }
        }.bind(this),
      );

      //循环将消息发送
      // while (this.afkComeMessage.length > 0) {
      //   var _item = this.afkComeMessage.pop();
      //   console.log('调用方法:', _item.from_username, this.afkMessage);
      //
      //   JIM.sendSingleMsg({
      //     // 'target_username': this.targetUsername,
      //     'target_username': _item.from_username,
      //     'content': '自动回复：' + mainModel.afkMessage,
      //     'appkey': mainModel.chatInfo.appkey,
      //   });
      // }
    },
    //设置afk
    setAfkON: function(inMessage) {
      this.afkMessage = inMessage;
      this.afkMode = true;
      this.afkTime = new Date().getTime();
    },
    setAfkOFF: function() {
      this.afkMessage = '';
      this.afkMode = false;
      this.afkTime = 0;
      this.afkComeMessage = []; //清空回复列表
    },
    setCustomizeMessage: function() {
      this.afkMessage = this.afkCustomizeMessage;
      this.afkMode = true;
      this.afkTime = new Date().getTime();
      this.$refs.afkChat.doClose();
    },
    //检查当前时间，是不是在活动开始和结束时间范围内。结束时间（因为默认是最后一天0点）按照时间+1天计算（用来表示第二天0点）
    checkDateTime: function() {
      //如果当前没有获得招聘会信息，则默认返回false
      if (!this.activityInfo) {
        return false;
      } else {
        var _currentDateTime = moment().valueOf();
        var _startDateTime = moment(this.activityInfo.holdingTime).valueOf();
        var _endDateTime = moment(this.activityInfo.holdingTime).
          add(1, 'days').
          valueOf();

        console.log(_startDateTime, _currentDateTime, _endDateTime);

        if (
          _currentDateTime > _startDateTime &&
          _currentDateTime < _endDateTime
        ) {
          return true;
        } else {
          return false;
        }
      }
    },
    //获得距离展会结束时间还有多久
    getEndTime: function() {
      // var _startTime = this.activityInfo.holdingTime;
      var _startTime = this.activityInfo.startDate;
      //考虑到如果有holdingZone，则使用
      var _holdingZone = this.activityInfo.holdingZone;
      if (
        _holdingZone.indexOf('-') > -1 &&
        _holdingZone.split('-').length === 2
      ) {
        _startTime =
          _startTime.substr(0, 10) + ' ' + _holdingZone.split('-')[0] + ':00';
      }
      console.log('startTime:', _startTime);

      //判断活动是否开始
      if (moment.duration(moment(_startTime) - moment()).asMinutes() > 0) {
        this.activityAlreadyStarted = false;
      } else {
        this.activityAlreadyStarted = true;
      }

      //默认计算时间是开始时间
      var _tempTime = parseInt(
        moment.duration(moment(_startTime) - moment()).asMinutes(),
      );
      //如果活动已经开始，则计算时间换算为结束时间
      if (this.activityAlreadyStarted) {
        _tempTime = parseInt(
          moment.duration(moment(this.activityTime) - moment()).asMinutes(),
        );
      }

      // console.log('剩余时间：', _tempTime);
      //如果时间是负数，则三个数都返回0
      if (_tempTime < 0) {
        this.activityEndTime = {
          day: 0,
          hour: 0,
          min: 0,
        };
        return false;
      }

      var _day = '';
      var _hour = '';
      var _min = '';
      if (this.activityTime === null) {
        this.activityEndTime = null;
      } else {
        _day = parseInt(_tempTime / (24 * 60));
        _tempTime = _tempTime % (24 * 60);
        _hour = parseInt(_tempTime / 60);
        _min = _tempTime % 60;
        this.activityEndTime = {
          day: _day,
          hour: _hour,
          min: _min,
        };

        console.log('activityEndTime:', this.activityEndTime);
      }
    },
    //获取场次ID
    getActivityId: function() {
      //算法：根据优先级别，首先从sessionStorage中获取activityid，然后再从url获取activityid，然后再判断是否获取到activityId
      var _tempActivityId = getParameterValue(
        window.location.href,
        'activityid',
      )
        ? getParameterValue(window.location.href, 'activityid')
        : window.localStorage.getItem('activityid');

      //如果从url传过来了activityid，就保存到sesstionStorage中去
      if (_tempActivityId) {
        window.localStorage.setItem('activityid', _tempActivityId);
      }

      this.activityId = _tempActivityId;
      //没有找到场次ID要报错
      if (!this.activityId) {
        this.$message.error('警告，您的入口不正确，请返回重新进入。');
      }
    },

    //获取招聘会详情
    //获取会场信息
    getActivityInfo: function() {
      //调用接口获取展会详情
      $.post(
        _SERVER + '/activity/getActivityById',
        {activityId: this.activityId},
        function(response) {
          // console.table(response.data);
          if (response.errCode === '00') {
            if (response.data === null) {
              this.$message.error('未找到任何信息');
            } else {
              this.activityInfo = response.data;
              this.activityPattern = response.data.activityPattern;
              this.activityTime = response.data.endDate;

              this.getJobSeekerList(); //用来获取匹配场次、企业的求职者信息

              //delete 根据约定因为活动都是线上，活动结束时间统一设置为当天23点59分59秒，所以做如下操作
              //考虑到如果有holdingZone，则使用
              var _holdingZone = this.activityInfo.holdingZone;
              if (
                _holdingZone.indexOf('-') > -1 &&
                _holdingZone.split('-').length === 2
              ) {
                this.activityTime =
                  response.data.endDate.substr(0, 10) +
                  ' ' +
                  _holdingZone.split('-')[1] +
                  ':00';
              } else {
                this.activityTime = moment(response.data.endDate).
                  set('hour', 23).
                  set('minute', 59).
                  set('second', 59).
                  format('YYYY-MM-DD HH:mm:ss');
              }

              //然后立刻算出当前时间离结束时间还有多久
              this.getEndTime();
              setInterval(
                function() {
                  this.getEndTime();
                }.bind(this),
                60000,
              );

              if (response.data.wordpressId) {
                //获取展会邀请函
                this.getHomeAdvertisement(response.data.wordpressId);
              }
            }
          } else {
            this.$message.error(response.errMsg);
          }
        }.bind(this),
      );
    },

    //获取参与公司和职位列表和状态
    getListActivityCompany: function() {
      $.post(
        _SERVER + '/activity/listActivityCompany',
        {
          activityId: this.activityId, // personId:   '1685117',
          // jobTitle:   ''
          // jobTitle:   this.searchKeyword
        },
        function(response) {
          // console.log(response.data.length);
          if (response.errCode === '00') {
            this.companyList = response.data;
          } else {
            this.$message.error(response.errMsg);
          }
        }.bind(this),
      );
    },

    //加载求职者列表
    getJobSeekerList: function() {
      $.post(
        _SERVER + '/activity/getOnsiteAndInvestList',
        {
          activityId: this.activityId,
          holdingTime: this.activityInfo
            ? this.activityInfo.holdingTime.substr(0, 10)
            : '', //TODO 如果传companyid，就要传holdtime，这里应该要做一个判断
          companyId: this.companyUserInfo ? this.companyUserInfo.companyId : '', //TODO 看看如果企业登陆没登陆对这个处理是否有影响
        },
        function(response) {
          if (response.errCode === '00') {
            //测试数据里面personName有null导致程序异常，这里修复一下
            response.data = response.data.map(function(item) {
              if (!item.personName) item.personName = '-无-';
              return item;
            });

            this.jobSeekerList = response.data;
          } else {
            this.$message.error(response.errMsg);
          }
        }.bind(this),
      );
    },

    //加载弹幕
    getDanmuList: function() {
      $.post(
        _SERVER + '/activity/queryBarrage',
        {
          activityId: this.activityId, // activityId: 581,
          num: this.danmuNum,
        },
        function(response) {
          if (response.errCode === '00') {
            //时间过滤，现在设置成过滤掉60分钟以上的
            response.data = response.data.filter(
              (item) => parseInt(item.split(' ')[0]) < 60,
            );
            this.danmuList = response.data.map(function(item) {
              if (item.length > 30) {
                var _tempItem = item.split(' ');
                if (_tempItem.length === 3) {
                  _tempItem[1] = _tempItem[1].substr(0, 20) + '...';
                  item = _tempItem.join(' ');
                }
              }
              return item;
            });
            // console.log('装弹完毕！');
          } else {
            this.$message.error(response.errMsg);
          }
          this.reloading = false;
        }.bind(this),
      );
    },

    //获取邀请函（新闻）详情
    getHomeAdvertisement: function(inId) {
      $.post(
        _SERVER + '/listAdvert/advertise',
        {
          id: inId,
        },
        function(response) {
          if (response.errCode === '00') {
            this.activityDesc = response.data;
          } else {
            this.$message.error(response.errMsg);
          }
        }.bind(this),
      );
    }, //调用计数器
    addCounter: function() {
      // 如果有activityId才需要调用计数器接口，如果是访客则不需要
      if (!this.activityId) {
        return false;
      }

      // 设定参数
      var _parameter = {
        city: encodeURIComponent(returnCitySN.cname),
        type: '4-1-1',
        url:
          'http://www.hnrcsc.com/mianshibao/pageview/activityId/' +
          this.activityId,
        ip: returnCitySN.cip,
        useragent: encodeURIComponent(navigator.userAgent),
      };
      $.post(_SERVER + '/webBrowsing/add', _parameter, function(result) {
        /*...*/
      });
    }, //查询展会统计数据
    queryWebsiteRecord: function() {
      $.post(
        _SERVER + '/activity/queryWebSiteRecord',
        {
          activityId: this.activityId,
        },
        function(response) {
          if (response.errCode === '00') {
            this.activityRecord = response.data;
          } else {
            this.$message.error(response.errMsg);
          }
        }.bind(this),
      );
    },
    //2022新版获取指定企业详情到当前企业信息
    getCurrentCompanyInfo2: function(inEnCompanyId) {
      //首先清空原来的当前企业信息
      this.currentCompanyInfo = null;
      $.postJSON(
        'https://qz.hnrcsc.com/hnrcwzp/auth-service/homePage/getCompanyInfo',
        {
          enCompanyId: inEnCompanyId,
          loginStatus: '0',
        },
        function(response) {
          if (response.code === '0000') {
            this.currentCompanyInfo = response.data;
          } else {
            this.$message.error('获取企业信息发生错误');
          }
        }.bind(this),
      );
    },
    //获取指定企业详情到当前企业信息
    //将被放弃
    getCurrentCompanyInfo: function(inCompanyId) {
      //首先清空原来的当前企业信息
      this.currentCompanyInfo = null;
      //获取新的当前企业信息，并放到当前企业信息变量中
      //TODO 这里personId是写死为空的，需要根据用户登陆情况，将用户的personId填写进来
      $.post(
        _SERVER + '/wxCompany/companyMessageByWx',
        {
          companyId: inCompanyId,
          personId: '0',
        },
        function(response) {
          if (response.errCode === '00') {
            this.currentCompanyInfo = response.data;
          } else {
            this.$message.error(response.errMsg);
          }
        }.bind(this),
      );
    },
    //2022新版对应获取企业招聘职位列表接口
    getRecruitList2: function(inEnCompanyId) {
      //首先清空原来的当前企业职位列表
      this.currentRecruitList = null;

      //设置接口参数 老系统：1-网络 2-现场 3-校招，外包新系统：0-现场 1-校招 2-网络
      $.postJSON(
        'https://qz.hnrcsc.com/hnrcwzp/auth-service/homePage/getCompanyRecruit',
        {
          enCompanyId: inEnCompanyId,
          type: [99, 2, 0, 1][this.activityInfo.activityPattern],
        },
        function(response) {
          console.log(response);
          if (response.code === '0000') {
            this.currentRecruitList = response.data.data.list;
          }
        }.bind(this),
      );
    },
    //获取制定企业的招聘职位列表
    getRecruitList: function(inCompanyId) {
      //首先清空原来的当前企业职位列表
      this.currentRecruitList = null;

      var _portUrl = '/wxCompany/wxCompanyRecruits'; //默认接口是线上招聘会的
      var _postParams = {companyId: inCompanyId}; //默认的参数
      //判断招聘会是线上还是线下
      if (this.activityInfo.activityPattern === 2) {
        _portUrl = '/wxCompany/wxCompanyRecruitsForSite'; //改为现场招聘会接口
        _postParams.recruitDate = this.activityInfo.holdingTime.substr(0, 10); //增加相关参数
      }

      //获取新的当前企业职位列表ID，并放到当前职位列表变量中
      $.post(
        _SERVER + _portUrl,
        _postParams,
        function(response) {
          if (response.errCode === '00') {
            this.currentRecruitList = response.data;
          } else {
            this.$message.error(response.errMsg);
          }
        }.bind(this),
      );
    }, //获取指定职位详情到当前职位信息
    getCurrentPositionInfo: function(inPositionId) {
      //首先清空原来的当前职位信息变量
      this.currentPositionInfo = null;
      //获取新的职位信息，并放到当前职位信息变量中
      $.post(
        _SERVER + '/wxCompany/wxRecruitMessage',
        {recruitId: inPositionId},
        function(response) {
          if (response.errCode === '00') {
            this.currentPositionInfo = response.data;
          } else {
            this.$message.error(response.errMsg);
          }
        }.bind(this),
      );
    },
    //2022年新版 展示当前企业详情信息
    showCurrentCompanyInfo2: function(inEnCompanyId) {
      this.getCurrentCompanyInfo2(inEnCompanyId);
      this.getRecruitList2(inEnCompanyId);
      this.companyInfoDialog = true;
    },
    //展示当前企业详情信息
    //即将淘汰
    showCurrentCompanyInfo: function(inCompanyId) {
      //console.log('showCurrentCompanyInfo:', inCompanyId);
      this.getCurrentCompanyInfo(inCompanyId);
      this.getRecruitList(inCompanyId);
      this.companyInfoDialog = true;
    },

    //展示特定（用当前职位接口）公司的职位信息
    showRecruitList: function(inCompanyId) {
      this.getRecruitList(inCompanyId);
      this.recruitListDialog = true;
    },

    //2022展示职位详情（传入职位ID）
    showRecruitInfo2: function(inRecruitId) {
      getEnCode(inRecruitId, function(response) {
        if (response.code === '0000') {
          window.open('https://qz.hnrcsc.com/pweb/#/positionB/jobDetails?id=' +
            response.data, '_blank');
        }
      });
    },

    //展示职位详情（传入职位ID）
    showRecruitInfo: function(inRecruitId) {
      this.getCurrentRecuitInfo(inRecruitId);
      this.recruitInfoDialog = true;
      console.log('showRecruitInfo: ', inRecruitId);
    },

    //获取当前职位详情
    getCurrentRecuitInfo: function(inRecruitId) {
      if (!inRecruitId) {
        return false;
      }

      this.currentRecruitInfo = null;

      //根据不同招聘会类型，调用不同的接口
      let _portUrl = '/wxCompany/wxRecruitMessage';
      if (this.activityInfo.activityPattern === 1)
        _portUrl = '/wxCompany/wxRecruitMessage';
      if (this.activityInfo.activityPattern === 2)
        _portUrl = '/wxCompany/wxRecruitSiteMessage';

      $.post(
        _SERVER + _portUrl,
        {
          recruitId: inRecruitId,
          recruitDate: this.activityInfo.holdingTime.substr(0, 10),
        },
        function(response) {
          if (response.errCode === '00') {
            //两个接口的数据格式不同，以前是按照网络职位的格式设置的，所以这里需要对现场招聘会转一下数据格式
            if (this.activityInfo.activityPattern === 1)
              this.currentRecruitInfo = response.data;
            if (this.activityInfo.activityPattern === 2) {
              this.currentRecruitInfo = {
                recruitId: response.data.recruitId,
                address: response.data.address,
                companyId: response.data.companyId,
                companyIdStr: '', //现场接口没有这个字段
                companyName: response.data.companyName,
                contactPerson: response.data.contactPerson,
                deptName: '',
                detail: response.data.recruitDetail,
                entProp: response.data.entPropCode,
                fax: response.data.fax,
                industry: response.data.industryCode,
                location: response.data.locationCode.trim(),
                lowerEdu: response.data.lowerEdu.trim(),
                phone: response.data.phone,
                recruitName: response.data.jobTitle,
                recruitPersons: response.data.persons,
                refreshDate: '',
                salary: response.data.salaryRange.trim(),
                welfare: '',
                workYears: response.data.workYearsRange.trim(),
              };

              console.log('走2：', this.currentRecruitInfo);
            }
          } else {
            this.$message.error(response.errMsg);
          }
        }.bind(this),
      );
    },

    //在弹出职位列表Dialog窗口投递简历
    recruitListSubmit: function() {
      //检查用户是否登陆，登陆以后才能投递职位
      if (!this.personUserInfo) {
        this.$message.error('请您先登陆，然后才能投递简历。');
        return false;
      }
      //进行职位投递操作
      console.log('投递了职位: ', this.currentRecruitChecked);
      this.postResume(this.currentRecruitChecked);

      //清空当前职位选择
      this.currentRecruitChecked = '';
      this.recruitListDialog = false;
    },

    //查看用户简历
    viewResume: function(inCvId) {
      console.log('DEBUG 暂时不调用这个接口');
      console.log('viewResume', inCvId);
      //先检查cvid是不是传了
      if (!inCvId) {
        this.$message.error('未找到该简历');
        return false;
      }
      //在检查企业账号是否登陆
      if (!this.companyUserInfo) {
        this.$message.error('请先登陆企业账号。');
        return false;
      }

      //清空当前简历变量
      this.currentResumeInfo = null;
      //打开当前简历展现dialog
      this.resumeInfoDialog = true;
      //从接口获取简历信息到当前简历变量
      //调用接口获取展会详情
      //这个是原来的老接口 $.post(_SERVER + '/personCenter/listPersonCvInfo', {cvId: inCvId}, function(response) {
      $.post(
        '//www.hnrcsc.com/web' +
        '/recruit/view/cvJsonList.action?cvId=' +
        inCvId,
        function(response) {
          console.log('resume data', response);
          if (response.map.status === '00') {
            this.currentResumeInfo = response.map;

            //成功后立刻异步查询该用户投递本企业的历史信息
            $.post(
              _SERVER + '/personCenter/getActivityRecruitFolder',
              {
                activityId: this.activityId,
                companyId: this.companyUserInfo.companyId,
                personId: response.map.jobPersonReg.personId,
              },
              function(response2) {
                if (response2.errCode === '00') {
                  // console.log('用户投递历史：', response2);
                  this.currentResumeInfo.postHistory = response2.data;
                } else {
                  this.$message.warning('获取该求职者投递历史错误');
                }
              }.bind(this),
            );
          } else {
            this.$message.error(response.map.errorMessage);
            this.resumeInfoDialog = false;
          }
        }.bind(this),
      );
    },

    //获取用户简历
    getResume: function(inCvId) {
      //先检查cvid是不是传了
      if (!inCvId) {
        this.$message.error('未找到该简历');
        return false;
      }
      //在检查企业账号是否登陆
      if (!this.companyUserInfo) {
        this.$message.error('请先登陆企业账号。');
        return false;
      }

      //清空当前简历变量
      this.currentResumeInfo = null;
      //从接口获取简历信息到当前简历变量
      //调用接口获取展会详情
      //这个是原来的老接口 $.post(_SERVER + '/personCenter/listPersonCvInfo', {cvId: inCvId}, function(response) {
      //PS: 这个接口是不同的所以不能用_SERVER
      $.post(
        '//www.hnrcsc.com/web' +
        '/recruit/view/cvJsonList.action?cvId=' +
        inCvId,
        function(response) {
          console.log('resume data', response);
          if (response.map.status === '00') {
            this.currentResumeInfo = response.map;

            //成功后立刻异步查询该用户投递本企业的历史信息
            $.post(
              _SERVER + '/personCenter/getActivityRecruitFolder',
              {
                activityId: this.activityId,
                companyId: this.companyUserInfo.companyId,
                personId: response.map.jobPersonReg.personId,
              },
              function(response2) {
                if (response2.errCode === '00') {
                  // console.log('用户投递历史：', response2);
                  this.currentResumeInfo.postHistory = response2.data;
                } else {
                  this.$message.warning('获取该求职者投递历史错误');
                }
              }.bind(this),
            );
          } else {
            this.$message.error(response.map.errorMessage);
            this.resumeInfoDialog = false;
          }
        }.bind(this),
      );
    },

    //登陆
    userLogin: function(inMode) {
      if (inMode === 'person') {
        window.location.href =
          'https://qz.hnrcsc.com/pweb/#/login?register=3&backurl=' +
          window.location.origin +
          window.location.pathname;
        return false;
      }
      if (inMode === 'company') {
        window.location.href =
          'https://qz.hnrcsc.com/pweb/#/login?register=1&backurl=' +
          window.location.origin +
          window.location.pathname;
        return false;
      }
    }, //自动登录（用获取个人和企业登陆状态接口，看哪个能返回已登录信息来判断）
    autoLogin: function() {
      getUserLogin(
        function(res) {
          console.log('res:', res);
          if (res.code === '0000') {
            //首先清空个人用户和企业用户（感觉其实也没必要）
            this.personUserInfo = this.companyUserInfo = null;
            if (res.type === 'person') {
              this.$message.success('正在加载个人账户信息……');
              this.loginMode = 'person';
              this.personUserInfo = res.info.data;

              //获取个人加密ID
              getEnCode(
                res.info.data.personId,
                function(res) {
                  if (res.code === '0000') {
                    this.enPersonId = res.data;
                    console.log(res.data, this.enPersonId);
                  }
                }.bind(this),
              );
            }
            if (res.type === 'company') {
              this.$message.success('正在加载企业账户信息……');
              this.loginMode = 'company';
              this.companyUserInfo = res.info.data;
              this.getJobSeekerList(); //重新加载求职责信息，用来获取是否投递过简历
            }
          }
        }.bind(this),
      );

      //后端确认，个人登录和企业登录状态是互斥的，同时只有一个状态存在
      //如果前端标记了退出状态，则不要自动登录
      /*if (window.sessionStorage.getItem('online_exit') !== '1') {
        //个人登录判断
        $.post(
          'http://www.hnrcsc.com/web/seekjob/video!personLogin.action',
          function (response) {
            if (response.map.status === '00') {
              console.log('执行个人自动登录');
              this.$message.success(
                '系统检测您已经使用个人方式登录过，正在加载个人账户信息……'
              );
              this.loginMode = 'person';
              this.getPersonUserInfo();
            }
          }.bind(this)
        );
        //企业登录判断
        $.post(
          'http://www.hnrcsc.com/web/recruit/login!checkLogin.action',
          function (response) {
            if (response.map.status === '00') {
              console.log('执行企业自动登录');
              this.$message.success(
                '系统检测您已经使用企业方式登录过，正在加载企业账户信息……'
              );
              this.loginMode = 'company';
              this.getCompanyUserInfo();
              this.getJobSeekerList(); //重新加载求职责信息，用来获取是否投递过简历
            }
          }.bind(this)
        );
      }*/
    }, //TODO DEBUG 用户登录
    debugCompanyUserInfo: function() {
      //{"agreementState":1,"backend":false,"companyId":1458,"companyName":"湖南人才网","email":"125493680@qq.com","emailVerifyFlag":"N","enCompanyId":"82FC3F6BF4CF7CAC","expireTime":"2022-02-17T19:23:17","flexEndDate":null,"flexStartDate":null,"isFlexable":false,"lastLoginDate":"2022-02-17T17:23:17","loginIp":"161.117.249.226","loginTimes":555,"logoUrl":null,"maxDownload":6000,"maxRecruitment":500,"maxSmInterview":1000,"maxSmInvitation":0,"maxVideoInterview":2000,"mbrEndDate":"2022-08-26T00:00:00","mbrStartDate":"2021-08-26T00:00:00","memberState":1,"orderId":136569,"password":"","remainVideoInterview":2000,"salesId":0,"stars":0,"usedVideoInterview":0,"userName":"hnrcw"}
      this.companyUserInfo = {
        agreementState: 1,
        backend: false,
        companyId: 1458,
        companyName: '湖南人才网',
        email: '125493680@qq.com',
        emailVerifyFlag: 'N',
        enCompanyId: '82FC3F6BF4CF7CAC',
        expireTime: '2022-02-17T19:23:17',
        flexEndDate: null,
        flexStartDate: null,
        isFlexable: false,
        lastLoginDate: '2022-02-17T17:23:17',
        loginIp: '161.117.249.226',
        loginTimes: 555,
        logoUrl: null,
        maxDownload: 6000,
        maxRecruitment: 500,
        maxSmInterview: 1000,
        maxSmInvitation: 0,
        maxVideoInterview: 2000,
        mbrEndDate: '2022-08-26T00:00:00',
        mbrStartDate: '2021-08-26T00:00:00',
        memberState: 1,
        orderId: 136569,
        password: '',
        remainVideoInterview: 2000,
        salesId: 0,
        stars: 0,
        usedVideoInterview: 0,
        userName: 'hnrcw',
      };
      //企业签到操作
      // this.companySign();
      this.loginMode = 'company';
      //登陆聊天账号
      this.readyChat();
      //企业登录后Tab默认切换到求职大厅的人才列表处
      this.currentTab = 1;
    },
    debugPersonUserInfo: function() {
      //{"agreementState":1,"clickedTimes":683,"createDt":"2012-08-03T00:00:00","cvComplete":true,"eduComplete":true,"email":"ju*************om","emailVerifyFlag":"false","enPersonId":"92D9F6E2013EC15C","genderCode":"01","lastLoginDt":"2022-02-17T10:44:02","lastLoginIp":"192.168.3.192","loginTimes":0,"map":{"applyNum":0,"siteApplyNum":11,"noticeNum":0,"viewAndVideoAddCounts":0,"isElite":false,"cvCount":3,"reservNum":0},"oldPassword":"12345678","password":"","personComplete":true,"personId":1685117,"personName":"曹珺1","photoLink":"photos\/2020\/1685117.jpg","recentClickedTimes":78,"tipFlag":"true","userName":"jun4rui"}
      window.sessionStorage.removeItem('online_exit');
      this.personUserInfo = this.companyUserInfo = null;
      this.personUserInfo = {
        agreementState: 1,
        clickedTimes: 683,
        createDt: '2012-08-03T00:00:00',
        cvComplete: true,
        eduComplete: true,
        email: 'ju*************om',
        emailVerifyFlag: 'false',
        enPersonId: '92D9F6E2013EC15C',
        genderCode: '01',
        lastLoginDt: '2022-02-17T10:44:02',
        lastLoginIp: '192.168.3.192',
        loginTimes: 0,
        map: {
          applyNum: 0,
          siteApplyNum: 11,
          noticeNum: 0,
          viewAndVideoAddCounts: 0,
          isElite: false,
          cvCount: 3,
          reservNum: 0,
        },
        oldPassword: '12345678',
        password: '',
        personComplete: true,
        personId: 1685117,
        personName: '曹珺1',
        photoLink: 'photos/2020/1685117.jpg',
        recentClickedTimes: 78,
        tipFlag: 'true',
        userName: 'jun4rui',
      };
      //个人签到
      this.personSign();
      this.loginMode = 'person';
      //登陆聊天账号
      this.readyChat();
      //个人登录后Tab默认切换到招聘大厅的企业列表处
      this.currentTab = 0;
    }, //获取个人用户登陆信息
    getPersonUserInfo: function() {
      //清除自动登录标记
      window.sessionStorage.removeItem('online_exit');
      //首先清空个人用户和企业用户（感觉其实也没必要）
      this.personUserInfo = this.companyUserInfo = null;
      $.post(
        'http://www.hnrcsc.com/web/seekjob/video!personLogin.action',
        function(response) {
          if (response.map.status === '00') {
            this.personUserInfo = response.map.user;
            console.log('个人用户已登录！');
            //个人签到
            this.personSign();
            //登陆聊天账号
            this.readyChat();
            //个人登录后Tab默认切换到招聘大厅的企业列表处
            this.currentTab = 0;
          } else {
            this.$message.error('个人账号登陆失败！');
          }
        }.bind(this),
      );
    }, //获取企业用户登陆信息
    getCompanyUserInfo: function() {
      //清除自动登录标记
      window.sessionStorage.removeItem('online_exit');
      //首先清空个人用户和企业用户（感觉其实也没必要）
      //感觉代码和获取个人账号的一样，也可以考虑合并起来
      this.personUserInfo = this.companyUserInfo = null;
      $.post(
        'http://www.hnrcsc.com/web/recruit/login!checkLogin.action',
        function(response) {
          if (response.map.status === '00') {
            this.companyUserInfo = response.map.user;
            console.log('企业用户已登录！');
            //企业签到操作
            this.companySign();
            //登陆聊天账号
            this.readyChat();
            //企业登录后Tab默认切换到求职大厅的人才列表处
            this.currentTab = 1;
          } else {
            this.$message.error('企业账号登陆失败！');
          }
        }.bind(this),
      );
    }, //退出登陆
    logout: function() {
      window.localStorage.removeItem('personInfo');
      window.localStorage.removeItem('companyInfo');
      setTimeout(function() {
        window.location.href = window.location.href.substr(
          0,
          window.location.href.indexOf('?'),
        );
      }, 1000);
      /*window.sessionStorage.setItem('online_exit', '1');
      //TODO 因为企业登出接口现在302而且没有返回值，暂时先调用后1000ms再刷新页面
      $.post('//www.hnrcsc.com/web/recruit/logout.action');
      $.post('//www.hnrcsc.com/web/seekjob/logout!json.action');
      setTimeout(function () {
        window.location.href = window.location.href.substr(
          0,
          window.location.href.indexOf('?')
        );
      }, 1000);*/
    }, //个人查看消息（打开聊天窗口）
    viewMessage: function() {
      //如果没有对话列表，则提示并返回
      if (!this.conversations || this.conversations.length === 0) {
        this.$message.warning('抱歉，您没有任何对话消息。');
      }
      var _tempTo = this.conversations[0];
      // 清空当前查看简历（其实也可以企业 查看的时候再清空）
      this.currentResumeInfo = null;
      if (this.personUserInfo) {
        this.chatToCompany(
          _tempTo.nickName,
          _tempTo.name.replace(/(^c|p)|(test$)/g, ''),
        );
      }
      if (this.companyUserInfo) {
        this.chatToPerson(
          _tempTo.nickName,
          _tempTo.name.replace(/(^c|p)|(test$)/g, ''),
        );
      }
    },

    //聊天(用来拦截以前函数的调用)
    toChat: function(inId, inName) {
      console.log(`toChat: ${inId} ${inName}`);
    },

    /*聊天相关*/
    // 聊天初始化
    chatInit: function() {
      console.log(`Do init.`);
      $.post(
        _SERVER + '/appointment/getAuthPayload',
        function(response) {
          console.log(response);
          response.data.flag = 1; //开启漫游
          //初始化
          JIM.init(response.data).onSuccess(
            function(data) {
              console.log('初始化成功:' + JSON.stringify(data));
              this.chatInfo = response.data; //将信息保存到info中

              this.register(); //初始化成功以后先注册
              this.login(); //初始化成功后立刻登录
            }.bind(this),
          ).onFail(function(data) {
            console.log('初始化失败:' + JSON.stringify(data));
          });
        }.bind(this),
      );
    },
    viewAndChat: function(inEnPersonId) {
      if (!this.checkDateTime()) {
        this.$message.error('本场招聘会还未开始，无法进行联系。');
        //TODO return false;//DEBUG 注释这里可无限制chat
      }
      if (this.companyUserInfo === null) {
        // this.$message.error('请登陆企业账号，并确认已参加该场招聘会。');
        this.$notify.error({
          title: '错误',
          dangerouslyUseHTMLString: true,
          duration: 0,
          message: '需要登陆企业账号，并确认已参加该场招聘会方可使用该功能。',
        });
        return false;
      }
      window.open(
        'https://qz.hnrcsc.com/gweb/#/operationLog?personId=' + inEnPersonId,
        '_blank',
      );
    },
    //开始和个人聊天 只有企业登陆以后才能调用
    chatToPerson: function(inPersonName, inPersonId) {
      console.log(`开始聊天（企业），企业ID：${inPersonName} ${inPersonId}`);
      if (!this.checkDateTime()) {
        this.$message.error('本场招聘会还未开始，无法进行联系。');
        // return false;//DEBUG 注释这里可无限制chat
      }

      if (this.companyUserInfo === null) {
        // this.$message.error('请登陆企业账号，并确认已参加该场招聘会。');
        this.$notify.error({
          title: '错误',
          dangerouslyUseHTMLString: true,
          duration: 0,
          message: '需要登陆企业账号，并确认已参加该场招聘会方可使用该功能。',
        });
        return false;
      }
      this.$message.info(`开始聊天（企业）：${inPersonName} ${inPersonId}`);
      this.tabName = 'chat';
      this.targetUser = {
        name: inPersonName,
        id: 'p' + inPersonId.toString() + 'test', //TODO 测试中，加入后缀_test
      };

      //如果不延迟200ms，则消息不一定能获取到
      setTimeout(
        function() {
          this.chatViewPersonResume();
        }.bind(this),
        200,
      );
    },
    makeCompanyQrcode: function() {
      //因为qrcode2Company只有在dialog出现后才会存在，不好预先画好二维码，所以采用这种方式直接删掉老的再重新生成
      $('#qrcode2Company__panel>#qrcode2Company').remove();
      $('#qrcode2Company__panel').prepend('<div id="qrcode2Company"></div>');
      new QRCode(document.getElementById('qrcode2Company'), {
        text: this.qrcode2CompanyUrl,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H,
      });
      console.log(this.qrcode2CompanyUrl);
    },
    showQrcode2Company: function(inEnCompanyId) {
      //检查个人用户是否登录
      if (!this.personUserInfo) {
        this.$message.error('请您先登录湖南人才网');
        return false;
      }

      this.qrcode2CompanyDialog = true;
      this.qrcode2CompanyUrl = 'https://qz.hnrcsc.com/chat?id=' + inEnCompanyId;
    },
    //开始和企业聊天 只有个人登陆以后才可以调用
    chatToCompany: function(inCompanyName, inCompanyId) {
      console.log(
        `开始聊天（求职者），企业ID：${inCompanyName} ${inCompanyId}`,
      );

      if (!this.checkDateTime()) {
        this.$message.error('本场招聘会还未开始，无法进行联系。');
        // return false;//DEBUG 注释本行可chat
      }

      if (this.personUserInfo === null) {
        // this.$message.error('请先登陆个人账号，才能和企业进行沟通。');
        this.loginDialog = true;
        return false;
      }
      this.targetUser = {
        name: inCompanyName,
        id: 'c' + inCompanyId.toString() + 'test', //TODO 测试中，加入后缀_test
      };

      this.getCurrentCompanyInfo(inCompanyId.toString());
      this.getRecruitList(inCompanyId.toString());
    }, // 聊天用户注册
    register: function() {
      console.log('开始注册用户：', this.selfUser);
      JIM.register(this.selfUser).onSuccess(function(data) {
        //data.code 返回码
        //data.message 描述
        console.log('注册成功', data.code, data.message);
      }).onFail(function(data) {
        // 同上
        console.log('注册失败', data.code, data.message);
      });
    }, // 聊天用户登陆
    login: function() {
      console.log('用户登录', this.selfUser);
      this.selfUser.password = '88888888';
      JIM.login(this.selfUser).onSuccess(
        function(data) {
          //data.code 返回码
          //data.message 描述
          //data.online_list[] 在线设备列表
          //data.online_list[].platform  Android,ios,pc,web
          //data.online_list[].mtime 最近一次登录时间
          //data.online_list[].isOnline 是否在线 true or false
          //data.online_list[].isLogin 是否登录 true or false
          //data.online_list[].flag 该设备是否被当前登录设备踢出 true or false
          console.log(`登陆成功 ${data.code} ${data.message}`);

          //用户登陆成功以后，更新用户信息
          JIM.updateSelfInfo({
            nickname: this.selfUser.nickname,
          }).onSuccess(function(data) {
            //data.code 返回码
            //data.message 描述
            console.log('更新用户信息成功');
          }).onFail(function(data) {
            //同上
            console.log('更新用户信息失败');
          });

          //调用获取会话列表
          this.getConversation();
          this.onSyncConversation();
        }.bind(this),
      ).onFail(function(data) {
        //同上
        console.log(`登陆失败 ${data.code}`);
      });
    }, // 监控业务事件
    onEventNotification: function() {
      JIM.onEventNotification(
        function(data) {
          console.log(`业务事件监听：`, data);
          var _errMsg = '';
          switch (data.event_type.toString()) {
            case '1': //同时登录或者被禁用，被迫下线
              _errMsg =
                '对话功能因为账号同时登录或者被禁用，被迫下线。您可以重新登陆或刷新页面再次上线。';
              break;
            case '2':
              _errMsg = '对话功能因为密码被修改，被迫下线示例';
              break;
          }

          if (_errMsg !== '') {
            this.$notify.warning({
              title: '警告',
              dangerouslyUseHTMLString: true,
              message: _errMsg,
              duration: 0,
            });
          }
        }.bind(this),
      );
    }, // 聊天发送消息comp`
    sendMessage: function(inMsgStr, inExtras) {
      console.log('对方的ID:', this.targetUser.id);
      if (this.targetUser.id === '') {
        alert('请选择一个用户');
        return false;
      }
      //检测是否在线
      if (!JIM.isConnect()) {
        this.$message.error(
          '和对话服务器的网络连接已断开，无法发送消息。您可以刷新页面或者重新登陆后再发送。',
        );
        return false;
      }

      //检测是否登陆
      if (!JIM.isLogin()) {
        this.$message.error(
          '可能因为账号在其它地方登陆所致您已退出登录，无法发送信息。您可以刷新页面或者重新登陆后再发送。',
        );
        return false;
      }

      /* *
       * 约定：
       * sendMessage如果发送特殊消息（事件）的话，inMsgStr默认不能为空！extras中保存{type/类型:'',msg/信息:''}
       * type表：
       *  0001  仅作为显示msg字段用
       *  0002  邀请对方进行视频面试
       *  0003  拒绝对面的视频面试
       * */

      JIM.sendSingleMsg({
        // 'target_username': this.targetUsername,
        target_username: this.targetUser.id,
        content: inMsgStr,
        appkey: this.chatInfo.appkey,
        extras: inExtras ? inExtras : '',
      }).onSuccess(
        function(data, msg) {
          console.log(
            '发送消息',
            data.code,
            data.message,
            data.target_username,
          );
          //data.code 返回码
          //data.message 描述
          //data.msg_id 发送成功后的消息 id
          //data.ctime_ms 消息生成时间,毫秒
          //data.appkey 用户所属 appkey
          //data.target_username 用户名
          //msg.content 发送成功消息体,见下面消息体详情
          this.sendMessageList.push({
            from_username: this.selfUser.nickname,
            from_id: this.selfUser.id,
            target_username: this.targetUser.name,
            message: inMsgStr,
            extras: inExtras ? inExtras : '',
            timestamp: new Date().getTime(),
          });
          setTimeout(
            function() {
              this.scroll2bottom();
            }.bind(this),
            500,
          );
        }.bind(this),
      ).onFail(
        function(data) {
          //data.code 返回码
          //data.message 描述
          console.log(`发送消息失败： ${data.code} ${data.message}`);
          var _errMsg = '发送消失失败，可能是对方未上线';
          switch (data.code.toString()) {
            case '882004':
              _errMsg =
                '对话功能授权失败，可能该账号在其它地方登录导致被踢，您可以刷新重新使用对话功能。';
              break;
            default:
              break;
          }
          this.$message.error(_errMsg);
        }.bind(this),
      );
    }, // 聊天未读会话数清零
    resetUnreadCount: function(inUsername) {
      JIM.resetUnreadCount({
        username: inUsername,
      });
    }, // 聊天获取会话列表
    getConversation: function() {
      if (!JIM.isLogin()) {
        console.log('尚未登陆，放弃getConversation');
        return false;
      }

      JIM.getConversation().onSuccess(
        function(data) {
          // console.log(`会话列表: ${data.code} ${data.message}`);
          // console.log(data);
          // this.conversations = data.conversations;
          this.conversations = _.reverse(
            _.sortBy(data.conversations, ['unread_msg_count']),
          );
          //20200921 更新，过滤掉该场展会之前的消息
          /*TODO 测试期间因为没有数据，所以暂时就不做过滤了
this.conversations = mainModel.conversations.filter(item => {
let _msgTime      = new Date(item.mtime).getTime();
let _activityTime = new Date(mainModel.activityInfo.holdingTime).getTime();
return _msgTime > _activityTime;
});*/
          //data.code 返回码
          //data.message 描述
          //data.conversations[] 会话列表，属性如下示例
          //data.conversations[0].extras 附加字段
          //data.conversations[0].unread_msg_count 消息未读数
          //data.conversations[0].name  会话名称
          //data.conversations[0].appkey  appkey(单聊)
          //data.conversations[0].username  用户名(单聊)
          //data.conversations[0].nickname  用户昵称(单聊)
          //data.conversations[0].avatar  头像 media_id
          //data.conversations[0].mtime 会话最后的消息时间戳
          //data.conversations[0].gid 群 id(群聊)
          //data.conversations[0].type  会话类型(3 代表单聊会话类型，4 代表群聊会话类型)
        }.bind(this),
      ).onFail(function(data) {
        //data.code 返回码
        //data.message 描述
        // console.log(`会话列表: ${data.code} ${data.message}`);
      });
    }, // 聊天离线消息同步监听
    onSyncConversation: function() {
      JIM.onSyncConversation(
        function(data) {
          console.log(`离线消息同步监听`);
          console.log(data);
          console.log(data[0]);
          console.log(data[1]);
          this.offlineConversations = data;
          // data[]
          // data[].msg_type 会话类型
          // data[].from_appey 单聊有效
          // data[].from_username 单聊有效
          // data[].from_gid 群聊有效
          // data[].unread_msg_count 消息未读数
          // 消息已读回执状态，针对自己发的消息
          // data[].receipt_msgs[]
          // data[].receipt_msgs[].msg_id
          // data[].receipt_msgs[].unread_count
          // data[].receipt_msgs[].mtime
          // 消息列表
          // data[].msgs[]
          // data[].msgs[].msg_id
          // data[].msgs[].content
          // data[].msgs[].msg_type
          // data[].msgs[].ctime_ms
          // data[].msgs[].need_receipt
          // data[].msgs[].custom_notification.enabled
          // data[].msgs[].custom_notification.title
          // data[].msgs[].custom_notification.alert
          // data[].msgs[].custom_notification.at_prefix
        }.bind(this),
      );
    }, // 聊天读取信息
    readMsg: function(inUsername, inUserId) {
      console.log(`读取信息： ${inUsername} ${inUserId}`, event.target);
      this.targetUser = {
        name: inUsername,
        id: inUserId,
      };
      // 清空未读会话数
      this.resetUnreadCount(inUserId);
      //如果是c开头的企业，则调用接口获取企业信息
      if (this.targetUser.id.indexOf('c') === 0) {
        this.getCurrentCompanyInfo(this.targetId);
        this.getRecruitList(this.targetId);
      }
      //如果是p开头的，则直接显示简历信息
      if (this.targetUser.id.indexOf('p') === 0) {
        this.chatViewPersonResume();
      }
    }, // 聊天启动步骤
    chatStartup: function() {
      // window.JIM = new JMessage({debug: true});
      window.JIM = new JMessage({debug: false});

      //异常断线监听
      JIM.onDisconnect(
        function() {
          console.log('连接断线');
          this.$notify.warning({
            title: '警告',
            dangerouslyUseHTMLString: true,
            message:
              '连接断线，可能同一账号在其它地方登陆，您可以尝试刷新或重新登陆',
            duration: 0,
          });
          //this.login(); //重新连接
        }.bind(this),
      );

      //接收消息
      JIM.onMsgReceive(
        function(data) {
          for (let item of data.messages) {
            this.receiveMessageList.push(item);
          }
          console.log('收到消息:', data, JSON.stringify(data));
          // console.log(data);
        }.bind(this),
      );

      //不停刷新会话列表
      setInterval(
        function() {
          this.getConversation();
        }.bind(this),
        5000,
      );

      //调用初始化
      this.chatInit();
    }, //清空当前聊天对象
    clearChatTargetUser: function() {
      this.targetUser = {
        name: '',
        id: '',
      };
    }, //点击发送按钮，发送聊天消息
    //调用导致堆栈溢出，暂时注释掉
    sendChatMessage: function() {
      if (this.chatMessage !== '') {
        this.sendMessage(this.chatMessage);
        this.chatMessage = '';
      } else {
        this.$message.error('请不要发送空信息');
      }
    }, //点击了选项卡
    mainTabClick: function() {
      //如果从“在线沟通”切换出去，就记录下当前收到消息的数量
      if (this.tabName !== 'chat') {
        this.messageRecordNum = this.receiveMessageList.length;
      }
    } /*~聊天相关*/,

    //新增的，用来自动获取取得用户类型，并确定用哪种方式启动聊天。函数在用户登陆成功后调用
    readyChat: function() {
      //如果聊天没有初始化（根据是否有selfUser.nickname判断），则调用聊天初始化
      if (this.selfUser.nickname === null) {
        //设置聊天账号
        //如果是企业
        if (this.loginMode === 'company') {
          this.selfUser = {
            username: 'c' + this.companyUserInfo.companyId.toString() + 'test', //TODO 测试中，加后缀_test,
            nickname: this.companyUserInfo.companyName.substr(0, 21),
            password: '88888888',
          };
        }
        //如果是个人
        if (this.loginMode === 'person') {
          this.selfUser = {
            username: 'p' + this.personUserInfo.personId.toString() + 'test', //TODO 测试中，加后缀_test,,
            nickname: this.personUserInfo.personName.substr(0, 21),
            password: '88888888',
          };
        }

        //聊天启动步骤
        this.chatStartup();
      }
    },

    //个人签到
    personSign: function() {
      //检查信息是否齐全
      if (this.personUserInfo === null || this.activityId === null) {
        console.log('个人签到失败，参数不全');
        return false;
      }
      //调用接口进行签到操作
      $.post(
        _SERVER + '/personActivity/personSign',
        {
          personId: this.personUserInfo.personId,
          activityId: this.activityId,
        },
        function(response) {
          if (response.errCode === '00') {
            console.log('个人签到成功！', response);
          } else {
            this.$message.error('签到失败！' + response.errMsg);
            //个人失败是否要清空个人登陆信息？
          }
        },
      );
    }, //企业签到
    companySign: function() {
      //检查信息是否齐全
      if (this.companyUserInfo === null || this.activityId === null) {
        console.log('企业签到失败，参数不全');
        // return false; //DEBUG 关闭这个可以避免企业签到
      }

      //调用报名签到接口
      $.post(
        _SERVER + '/enterprise/invitationAndSign',
        {
          activityId: this.activityId,
          companyId: this.companyUserInfo.companyId,
          sceneType: 1 /*1是签到模式*/,
        },
        function(response) {
          if (response.errCode === '00') {
            //签到成功操作暂不处理
            console.log('企业签到成功！', response);
          } else {
            this.$message.error('企业签到失败！' + response.errMsg);
            // this.companyUserInfo = null; //签到失败，就清空企业信息 //DEBUG 关闭这里
          }
        }.bind(this),
      );
    },

    //聊天用查看公司详情
    chatViewCompanyInfo: function() {
      //设定当前企业为target企业
      this.getCurrentCompanyInfo(this.targetId);
      this.getRecruitList(this.targetId);

      $('#chat-area_other .video-chat').attr('src', ''); //为了节省资源和保证企业聊天离线完成，一定要清空聊天iframe
      $('#chat-area_other .model').removeClass('active');
      $('#chat-area_other .company-info.model').addClass('active');
    }, //聊天用查看个人简历
    chatViewPersonResume: function() {
      //获取用户简历列表
      $.post(
        _SERVER + '/personCenter/listPersonCv',
        {personId: this.targetId},
        function(response) {
          if (response.errCode === '00') {
            //获取用户默认简历ID
            var _tempCvId = 0;
            for (var i = 0; i < response.data.length; i++) {
              if (response.data[i].DEFAULTFLAG === 'Y') {
                _tempCvId = response.data[i].CVID;
              }
            }
            if (_tempCvId === 0) {
              this.$message.warning('该用户没有简历，或没有设置默认简历');
            } else {
              //获取用户简历到当前简历变量
              this.getResume(_tempCvId);
            }
          } else {
            this.$message.error(response.errMsg);
            return false;
          }
        }.bind(this),
      );

      $('#chat-area_other .video-chat').attr('src', ''); //为了节省资源和保证企业聊天离线完成，一定要清空聊天iframe
      $('#chat-area_other .model').removeClass('active');
      $('#chat-area_other .person-resume.model').addClass('active');
    }, //接受对方的视频邀请
    accept2videoChat: function() {
      this.chatViewVideo();
    }, //邀请对方进行视频聊天
    invite2videoChat: function() {
      //邀请对方进入视频聊天室的系统消息
      this.sendMessage('-', {type: '0002', msg: ''});
      this.chatViewVideo();
    }, //聊天用打开视频聊天
    chatViewVideo: function() {
      //区分当前账号是个人还是公司
      //个人方式
      if (this.personUserInfo !== null) {
        //iframe不支持https暂时用窗口打开方式取代 $('#chat-area_other .video-chat').attr('src', 'https://www.hnrcsc.com/videochat/client.html?personid=' + this.personUserInfo.personId + '&companyid=' + (this.targetId));
        window.open(
          'https://www.hnrcsc.com/videochat/client.html?personid=' +
          this.personUserInfo.personId +
          '&companyid=' +
          this.targetId,
        );
      }
      //企业方式
      if (this.companyUserInfo !== null) {
        //iframe不支持https暂时用窗口打开方式取代 $('#chat-area_other .video-chat').attr('src', 'https://www.hnrcsc.com/videochat/hr.html?companyid=' + this.companyUserInfo.companyId + '&orderid=' + this.companyUserInfo.orderId);
        window.open(
          'https://www.hnrcsc.com/videochat/hr.html?companyid=' +
          this.companyUserInfo.companyId +
          '&orderid=' +
          this.companyUserInfo.orderId,
        );
      }

      $('#chat-area_other .model').removeClass('active');
      $('#chat-area_other .video-chat.model').addClass('active');
    },

    //投递简历接口2022
    //该接口只支持线上招聘会，如果支持线下和校招需要对方法进行扩充
    postResume2: function(inRecruitId, inCompanyId) {
      //DEBUG
      console.log('投递简历2:', inRecruitId, inCompanyId);

      //检查用户简历状态
      getResumeInfo(this.personUserInfo.enPersonId,
        this.personUserInfo.personId, window.localStorage.getItem('auth'),
        function(res) {
          //接口返回成功
          if (res.code === '0000') {
            //检查简历状态
            if (res.data.data.cvStatus > 0 && res.data.data.eduStatus > 0 &&
              res.data.data.jobHistStatus > 0 &&
              res.data.data.personInfoStatus > 0) {
              //简历完整

              //如果是线上招聘会
              if (this.activityInfo.activityPattern === 1) {
                //执行线上职位投递
                postResumeOnline(this.personUserInfo.enPersonId, inRecruitId,
                  function(res2) {
                    if (res2.code === '0000') {
                      this.$message.success('简历投递成功');
                    }
                    //TODO 接口返回error的错误没有处理，因为暂时没发现
                    if (res2.code === '0001') {
                      this.$message.error('接口错误');
                    }
                    if(res2.code==='0002'){
                      res2.data.code==='9999'?this.$message.error('通常错误'):this.$message.error(res2.data.msg);
                    }
                  }.bind(this));
              }
              //如果是线下招聘会（2现场，3校招）
              if (this.activityInfo.activityPattern === 2 ||
                this.activityInfo.activityPattern === 3) {
                var _inType = this.activityInfo.activityPattern===2?1:2;
                //调用接口开搞
                postResumeOnsite(this.personUserInfo.enPersonId,inRecruitId,res.data.data.cv.cvId,inCompanyId,_inType,function(res3){
                  console.log(res3);
                  if(res3.code==='0000'){
                    this.$message.success('投递成功');
                  }else{
                    this.$message.error(res3.data.msg);
                  }
                }.bind(this));
              }
            } else {
              this.$message.error('您的简历不完整，无法投递。');
              return false;
            }
          } else {
            this.$message.error(res.msg);
          }
        }.bind(this));

      //线上招聘的分支
      /*if (this.activityInfo.activityPattern === 1) {
        $.ajax({
          url: "https://qz.hnrcsc.com/hnrcwzp/person-service/deliveryDetail/insertRecruitFolder",
          type: "POST",
          data: JSON.stringify({
            userType: 1,
            recruitId: inRecruitId,
            personId: this.enPersonId,
          }),
          headers: {
            authorization: window.localStorage.getItem("auth"),
            userType: 1,
            userId: this.enPersonId,
            requestSource: 2,
          },
          dataType: "json",
          contentType: "application/json; charset=utf-8",
          success: function(response) {
            console.log(response);
            if (response.code === "0000") {
              this.$message.success("投递简历成功！");
            }
          }.bind(this),
        });
      }*/

      //线下招聘的分支
      //校园招聘暂不考虑
    },

    //投递简历 待废弃
    postResume: function(inRecruitId) {
      if (!this.personUserInfo) {
        this.$message.error('您登陆以后才可以投递简历');
        return false;
      }
      console.log('投递简历：', inRecruitId);

      let _params = {
        recruitId: inRecruitId,
        personId: this.personUserInfo.personId,
      };
      //设定接口
      let _interface = '/RecruitEdismax/recruitApply'; //默认线上投递
      if (this.activityInfo.activityPattern === 1)
        _interface = '/RecruitEdismax/recruitApply';
      if (this.activityInfo.activityPattern === 2)
        _interface = '/wxCompany/recruitApplySite';
      /*暂时不考虑校招的情况 if (this.activityPattern === 3) _interface = '/wxCompany/recruitApplySite';*/
      $.post(
        _SERVER + _interface,
        _params,
        function(response) {
          if (response.errCode === '00') {
            this.$message.success('简历投递成功');
          } else {
            if (
              response.errMsg.indexOf('没有默认简历') > -1 ||
              response.errMsg.indexOf('简历已经作废') > -1 ||
              response.errMsg.indexOf('简历不完善') > -1
            ) {
              this.$notify.warning({
                title: '提醒',
                dangerouslyUseHTMLString: true,
                message:
                  '您的简历还不完善，将无法投递职位和面试，请点击<a href="person_register.html">这里</a>进行完善',
                duration: 0,
              });
            } else {
              //其它情况的处理
              this.$message.error(response.errMsg);
            }
          }
        }.bind(this),
      );
    },

    //折叠 or 展开企业详情
    doFold: function(inParentDom) {
      console.log($(inParentDom).find('.company-info_desc').prop('class'));
      if (
        $(inParentDom).
          find('.company-info_desc').
          prop('class').
          indexOf('cj-ellipsis-multiline') > -1
      ) {
        $(inParentDom).
          find('.company-info_desc').
          removeClass('cj-ellipsis-multiline');
      } else {
        $(inParentDom).
          find('.company-info_desc').
          addClass('cj-ellipsis-multiline');
      }
      //原生写法兼容性较差，暂时不用
      // if(event.target.parentElement.classList.value.indexOf('cj-ellipsis-multiline')>-1){
      //   event.target.parentElement.classList.remove('cj-ellipsis-multiline');
      // }else{
      //   event.target.parentElement.classList.add('cj-ellipsis-multiline');
      // }
    },

    //滚动对话框到最底部
    scroll2bottom: function() {
      let _ele = document.querySelector('#chat-message');
      _ele.scrollTo({
        top: _ele.scrollHeight - _ele.clientHeight,
        behavior: 'smooth',
      });
    },

    //下载当前聊天记录
    downloadChatLog: function() {
      var _chatLog = '';
      mainModel.offlineConversations.map(function(item) {
        item.msgs.map(function(item2) {
          // console.log(
          //   /*item2.content,*/
          //   moment(item2.content.create_time).format('YYYY-MM-DD hh:mm:ss'),
          //   item2.content.from_name,
          //   '发给',
          //   item2.content.target_name,
          //   item2.content.msg_body.text
          // );
          _chatLog +=
            moment(item2.content.create_time).format('YYYY-MM-DD hh:mm:ss') +
            ',' +
            item2.content.from_name +
            ' 发给 ' +
            item2.content.target_name +
            '\n' +
            item2.content.msg_body.text +
            '\n\n';
        });

        var _dom = document.createElement('a');
        _dom.setAttribute(
          'href',
          'data:text/plain;charset=utf-8,' + encodeURIComponent(_chatLog),
        );
        _dom.setAttribute('download', '聊天记录.txt');
        // _dom.setAttribute('class', 'download__chat-log');
        _dom.style.display = 'none';
        _dom.click();
        // _dom.remove();
      });
    },
  },
  created: function() {
    this.autoLogin();
    //如果有参数mode，则根据mode的值来获取用户信息
    // this.loginMode = getParameterValue(window.location.href, 'mode');
    // if (this.loginMode === 'person') this.getPersonUserInfo();
    // if (this.loginMode === 'company') this.getCompanyUserInfo();
    //没有mode参数，则使用autoLogin帮助已经登录的用户自动登录
    // if (this.loginMode === '') this.autoLogin();

    this.getActivityId(); //获取场次ID
    this.addCounter(); //调用计数器
    this.getActivityInfo(); //获取展会信息
    this.getJobSeekerList(); //获取求职者列表
    this.getListActivityCompany(); //加载企业和职位信息
    this.queryWebsiteRecord(); //查询展会数据
    /*装载弹幕*/
    this.reloading = true;
    this.getDanmuList(); //加载弹幕列表
  },
  mounted: function() {
    //全自动弹幕发射机器
    setInterval(
      function() {
        //如果没子弹了，就重新装载子弹
        if (this.danmuList.length === 0) {
          if (!this.reloading) {
            // console.log('reloading.');
            this.reloading = true;
            this.getDanmuList(); //加载弹幕列表
          }
        } else {
          //发射从弹幕池动态获取最上面的弹幕
          $('#danmu').barrager({
            img: 'images/icon_danmu_avatar.png',
            info: this.danmuList.splice(0, 1),
            speed: parseInt(Math.random() * 5) + 15,
          });
        }
      }.bind(this),
      3000,
    );

    //定时操作
    setInterval(
      function() {
        if (this.companyUserInfo) this.companySign(); //刷新企业在线状态
        if (this.personUserInfo) this.personSign(); //刷新个人在线状态

        this.getActivityInfo(); //获取展会信息
        this.getJobSeekerList(); //获取求职者列表
        this.getListActivityCompany(); //加载企业和职位信息
        //TODO 暂时去掉看看效果 this.checkLoginStatus(); //检查用户登录状态
      }.bind(this),
      15000,
    );

    //注册快捷键处理
    hotkeys.filter = function(event) {
      return true;
    };
    hotkeys(
      'ctrl+enter',
      {
        element: document.getElementById('input-message'),
      },
      function() {
        this.sendChatMessage();
      }.bind(this),
    );
  },
});
