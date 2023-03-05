let User = syzoj.model('user');
let Article = syzoj.model('article');
let Contest = syzoj.model('contest');
let Chapter = syzoj.model('chapter')
let ContestPlayer = syzoj.model('contest_player');

let Divine = syzoj.lib('divine');
let TimeAgo = require('javascript-time-ago');
let zh = require('../libs/timeago');
TimeAgo.locale(zh);
const timeAgo = new TimeAgo('zh-CN');

app.get('/', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });


    let group_num = res.locals.user.group_num;
    if (syzoj.config.blacklist.indexOf(group_num) != -1) throw new ErrorMessage('系统维护中......');
    if (syzoj.config.exam.indexOf(group_num) != -1) throw new ErrorMessage('比赛期间，限制访问。');
    
    let ranklist = await User.queryRange([1, syzoj.config.page.ranklist_index], { is_show: true }, {
      [syzoj.config.sorting.ranklist.field]: syzoj.config.sorting.ranklist.order
    });
    await ranklist.forEachAsync(async x => x.renderInformation());

    let notices = (await Article.find({
      where: { is_notice: true }, 
      order: { public_time: 'DESC' }
    })).map(article => ({
      title: article.title,
      url: syzoj.utils.makeUrl(['article', article.id]),
      date: syzoj.utils.formatDate(article.public_time, 'L')
    }));

    let fortune = null;
    
    fortune = Divine(res.locals.user.username, res.locals.user.sex);
    

    let id = res.locals.user.plan;
    if (!(id >= 1 && id <= 5 && id != 3)) id = 2;
    let trainingTitle;
    
    if (id == 2) trainingTitle = "入门训练";
    else if (id == 4) trainingTitle = "普及训练";
    else if (id == 1) trainingTitle = "提高训练";
	else if (id == 5) trainingTitle = "省选训练";

    let chapters = await Chapter.createQueryBuilder()
                                .where('plan_id = :id', {id})
                                .orderBy("start_time", "ASC")
                                .getMany();
                                    
	let msg = {};
	msg['ac'] = 0;
	msg['tot'] = 0;

        
    for (let chapter of chapters) {
            let id = chapter.id;
            let ac_num = 0, tot_num = 0;
            let sections = await Contest.createQueryBuilder()
                                        .select('Contest.id')
                                        .addSelect('Contest.totproblems')
                                        .addSelect('Contest.title')
                                        .where('chapter_id = :id', {id})
                                        .getMany();
        
            
            let user_id;
            if (res.locals.user) user_id = res.locals.user.id;

            for (let section of sections) {
                let contest_id = section.id;

                let contest = await Contest.findById(contest_id);
                let problems_id = await contest.getProblems();

                tot_num += section.totproblems;
                let contest_score = await ContestPlayer.createQueryBuilder()
                                                .select('ContestPlayer.score_details')
                                                .where('user_id = :user_id', {user_id})
                                                .andWhere('contest_id = :contest_id', {contest_id})
                                                .getOne();

                
                if (contest_score) {
                    for (let problemId in contest_score.score_details) {
                        if (problems_id.includes(parseInt(problemId)) && contest_score.score_details[problemId] && contest_score.score_details[problemId].score >= 100) ac_num++;
                    }
                }   
            }
            chapter.ac_num = ac_num;
            chapter.tot_num = tot_num;
            msg['ac'] += ac_num;
            msg['tot'] += tot_num;
        }



    res.render('index', {
      ranklist: ranklist,
      notices: notices,
      fortune: fortune,
      chapters: chapters,
      trainingTitle,
      links: syzoj.config.links,
      msg: msg
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/help', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let group_num = res.locals.user.group_num;
    if (syzoj.config.blacklist.indexOf(group_num) != -1) throw new ErrorMessage('系统维护中......');
    if (syzoj.config.exam.indexOf(group_num) != -1) throw new ErrorMessage('比赛期间，限制访问。');
    
    res.render('help');
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
