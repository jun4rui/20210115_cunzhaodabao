var mainModel = new Vue({
  el:      '#main',
  data:    {
    currentTab:         0,      //表示当前tab选择第几个，{0:招聘大厅,1:求职大厅}
    currentStatus:      0,      //表示当前status选择第几个，{0:全部企业,1:在线企业}
    companyId:          null,   //企业ID，企业登陆以后会有值
    activityId:         null,   //展会ID
    activityInfo:       null,   //展会信息
    activityPattern:    null,   //展会模式
    activityTime:       null,   //展会时间
    activityRecord:     null,   //展会统计数据
    activityDesc:       null,   //展会邀请函内容
    activityDescDialog: false,  //邀请函显示开关
    companyInfoDialog:  false,  //企业详情显示开关（可关注企业）
    recruitListDialog:  false,  //职位列表显示开关（投递简历用）
    resumeInfoDialog:   false,  //简历信息显示开关
    companyList:        null,   //企业列表（包括职位）
    danmuList:          [],     //弹幕列表
    danmuNum:           50,     //每次加载弹幕数量
    reloading:          false,  //是否在装弹？

    currentCompanyInfo:    null,//当前企业（信息）
    currentRecruitList:    null,//当前（企业）职位列表
    currentRecruitChecked: '',  //当前职位选择了谁
    currentPositionInfo:   null,//当前职位（信息）
    currentResumeInfo:     null,//当前简历

    jobSeekerList: null,    //求职责列表
    currentRegion: ''       //当前地区（默认空字符串表示全部

  },
  methods: {
    //获取场次ID
    getActivityId: function() {
      this.activityId = getParameterValue(window.location.href, 'activityid') || '';
      this.activityId = '601';//TODO 测试写死，用完后记得移除
      //没有找到场次ID要报错
      if (!this.activityId) {
        this.$message.error('警告，您的入口不正确，请返回重新进入。');
      }
    },

    //获取招聘会详情
    //获取会场信息
    getActivityInfo: function() {
      //调用接口获取展会详情
      $.post(_SERVER + '/activity/getActivityById', {activityId: this.activityId}, function(response) {
        // console.table(response.data);
        if (response.errCode === '00') {
          if (response.data === null) {
            this.$message.error('未找到任何信息');
          } else {
            this.activityInfo    = response.data;
            this.activityPattern = response.data.activityPattern;
            this.activityTime    = response.data.holdingTime;

            if (response.data.wordpressId) {
              //获取展会邀请函
              this.getHomeAdvertisement(response.data.wordpressId);
            }
          }
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },

    //获取参与公司和职位列表和状态
    getListActivityCompany: function() {
      $.post(_SERVER + '/activity/listActivityCompany', {
        activityId: this.activityId
        // personId:   '1685117',
        // jobTitle:   ''
        // jobTitle:   this.searchKeyword
      }, function(response) {
        // console.log(response.data.length);
        if (response.errCode === '00') {
          this.companyList = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },

    //加载求职者列表
    getJobSeekerList: function() {
      $.post(_SERVER + '/activity/getOnsiteAndInvestList', {
        //activityId: this.activityId, //TODO 记得改回来
        activityId: 581
        //holdingTime: this.activityInfo.holdingTime.substr(0, 10),//TODO 如果传companyid，就要传holdtime，这里应该要做一个判断
        //companyId:  this.companyId || '1458',//TODO 看看如果企业登陆没登陆对这个处理是否有影响
      }, function(response) {
        if (response.errCode === '00') {
          this.jobSeekerList = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },

    //加载弹幕
    getDanmuList: function() {
      $.post(_SERVER + '/activity/queryBarrage', {
        // activityId: this.activityId,
        activityId: 581,
        num:        this.danmuNum
      }, function(response) {
        if (response.errCode === '00') {
          this.danmuList = response.data;
          console.log('装弹完毕！');
        } else {
          this.$message.error(response.errMsg);
        }
        this.reloading = false;
      }.bind(this));
    },

    //获取邀请函（新闻）详情
    getHomeAdvertisement: function(inId) {
      $.post(_SERVER + '/listAdvert/advertise', {
        id: inId
      }, function(response) {
        if (response.errCode === '00') {
          this.activityDesc = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },
    //调用计数器
    addCounter: function() {
      // 设定参数
      var _parameter = {
        'city':      encodeURIComponent(returnCitySN.cname),
        'type':      '4-1-1',
        'url':       window.location.href,
        'ip':        returnCitySN.cip,
        'useragent': encodeURIComponent(navigator.userAgent)
      };
      $.post(_SERVER + '/webBrowsing/add', _parameter, function(result) {/*...*/});
    },
    //查询展会统计数据
    queryWebsiteRecord: function() {
      $.post(_SERVER + '/activity/queryWebSiteRecord', {
        activityId: this.activityId
      }, function(response) {
        if (response.errCode === '00') {
          this.activityRecord = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },
    //获取指定企业详情到当前企业信息
    getCurrentCompanyInfo: function(inCompanyId) {
      //首先清空原来的当前企业信息
      this.currentCompanyInfo = null;
      //获取新的当前企业信息，并放到当前企业信息变量中
      //TODO 这里personId是写死为空的，需要根据用户登陆情况，将用户的personId填写进来
      $.post(_SERVER + '/wxCompany/companyMessageByWx', {companyId: inCompanyId, personId: '0'}, function(response) {
        if (response.errCode === '00') {
          this.currentCompanyInfo = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },
    //获取制定企业的招聘职位列表
    getRecruitList: function(inCompanyId) {
      //首先清空原来的当前企业职位列表
      this.currentRecruitList = null;
      //获取新的当前企业职位列表ID，并放到当前职位列表变量中
      $.post(_SERVER + '/wxCompany/wxCompanyRecruits', {companyId: inCompanyId}, function(response) {
        if (response.errCode === '00') {
          this.currentRecruitList = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },
    //获取指定职位详情到当前职位信息
    getCurrentPositionInfo: function(inPositionId) {
      //首先清空原来的当前职位信息变量
      this.currentPositionInfo = null;
      //获取新的职位信息，并放到当前职位信息变量中
      $.post(_SERVER + '/wxCompany/wxRecruitMessage', {recruitId: inPositionId}, function(response) {
        if (response.errCode === '00') {
          this.currentPositionInfo = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },

    //展示当前企业详情信息
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

    //在弹出职位列表Dialog窗口投递简历
    recruitListSubmit: function() {
      //TODO 检查用户是否登陆，登陆以后才能投递职位
      //TODO 进行职位投递操作
      console.log('投递了职位: ', this.currentRecruitChecked);
      //清空当前职位选择
      this.currentRecruitChecked = '';
      this.recruitListDialog     = false;
    },

    //查看用户简历
    viewResume: function(inCvId) {
      console.log(`viewResume: ${inCvId}`);
      inCvId = 1413408;//TODO cvid先写死
      if (!inCvId) {
        this.$message.error('未找到该简历');
        return false;
      }
      //清空当前简历变量
      this.currentResumeInfo = null;
      //打开当前简历展现dialog
      this.resumeInfoDialog  = true;
      //从接口获取简历信息到当前简历变量
      //调用接口获取展会详情
      $.post(_SERVER + '/personCenter/listPersonCvInfo', {cvId: inCvId}, function(response) {
        // console.table(response.data);
        if (response.errCode === '00') {
          if (response.data === null) {
            this.$message.error('未找到任何信息');
            this.resumeInfoDialog = false;
          } else {
            this.currentResumeInfo = response.data;
          }
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },

    //聊天
    toChat:function(inPersonId){
      console.log(`toChat: ${inPersonId}`);
    }

  },
  created: function() {
    this.getActivityId();//获取场次ID
    this.addCounter();//调用计数器
    this.getActivityInfo();//获取展会信息
    this.getJobSeekerList();//获取求职者列表
    this.getListActivityCompany();//加载企业和职位信息
    this.queryWebsiteRecord();//查询展会数据
    /*装载弹幕*/
    this.reloading = true;
    this.getDanmuList();//加载弹幕列表
    /*TODO 一些数据要定时进行刷新*/
    // 入场求职者的状态
    // 企业和职位状态
  },
  mounted: function() {
    //全自动弹幕发射机器
    setInterval(function() {
      //如果没子弹了，就重新装载子弹
      if (this.danmuList.length === 0 && !this.reloading) {
        console.log('重新装弹中');
        this.reloading = true;
        this.getDanmuList();//加载弹幕列表
        return false;
      }
      //发射从弹幕池动态获取最上面的弹幕
      $('#danmu').barrager({
        img:   'images/icon_danmu_avatar.png',
        info:  this.danmuList.splice(0, 1),
        speed: parseInt(Math.random() * 5) + 15
      });

    }.bind(this), 3000);

    //DEBUG
    setTimeout(function(){
      $('.company_name').eq(0).click();
    },3000);
  }
});