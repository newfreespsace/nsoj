let Plan         = syzoj.model('plan');
let Chapter      = syzoj.model('chapter')
let Contest      = syzoj.model('contest');
let ContestAcnum = syzoj.model('contest_acnum');
let ContestPlayer = syzoj.model('contest_player');

app.get('/plans', async(req, res) => {
    try {
        let group_num = res.locals.user.group_num;
        if (syzoj.config.blacklist.indexOf(group_num) != -1) throw new ErrorMessage('系统维护中......');
        if (syzoj.config.exam.indexOf(group_num) != -1) throw new ErrorMessage('比赛期间，限制访问。');

        let plans = await Plan.createQueryBuilder()
                             .getMany();

        console.log(plans);
        res.render('plans', {
            plans,
        });
    } catch (e) {
        syzoj.log(e);
        res.render('error', {
            err: e
        });
    }
});


app.get('/chapters/:id', async(req, res) => {
    try {
        if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
        
        let group_num = res.locals.user.group_num;
        if (syzoj.config.blacklist.indexOf(group_num) != -1) throw new ErrorMessage('系统维护中......');
        if (syzoj.config.exam.indexOf(group_num) != -1) throw new ErrorMessage('比赛期间，限制访问。');

        let id = parseInt(req.params.id);
        if (!(id >= 1 && id <= 5)) id = 2;
        let trainingTitle;
        if (id === 1) trainingTitle = "算法进阶训练";
        else if (id == 2) trainingTitle = "入门训练";
        else if (id == 3) trainingTitle = "基础算法训练";
	else if (id == 5) trainingTitle = "省选训练";
        else trainingTitle = "基础数据结构训练";

        let chapters = await Chapter.createQueryBuilder()
                                    .where('plan_id = :id', {id})
                                    .orderBy("start_time", "ASC")
                                    .getMany();
                                    

        let msg = {};
	msg.ac = 0;
	msg.tot = 0;
        
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
	    msg.ac += ac_num;
	    msg.tot += tot_num;
        }

        res.render('chapters', {
            chapters,
            trainingTitle,
	    msg
        });
    } catch (e) {
        syzoj.log(e);
        res.render('error', {
            err: e
        });
    }
});

app.get('/chapter/:id/edit', async (req, res) => {
     try {
	if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    // if (!res.locals.user.is_admin && syzoj.config.exam) throw new ErrorMessage('比赛期间，限制访问。');
    if (!res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此项操作！');
    let id = parseInt(req.params.id);
    let chapter = await  Chapter.findById(id);
    
    if (!chapter) {
        if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');
        chapter = await Chapter.create();
        chapter.id = 0;
    }        

    res.render('chapters_edit', {
        chapter,
    });
    } catch(e) {
      
      syzoj.log(e);
        res.render('error', {
            err: e
        });	    
    }	     
});

app.post('/chapter/:id/edit', async (req, res) => {
    try{
        if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
        if (!res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此项操作！');

        let chapter_id = parseInt(req.params.id);
        let chapter = await Chapter.findById(chapter_id);

        if (!chapter) {
            chapter = await Chapter.create();
        }

        chapter.title = req.body.title;
        chapter.subtitle = req.body.subtitle;
        chapter.start_time = syzoj.utils.parseDate(req.body.start_time);
        chapter.plan_id = req.body.plan_id;

        await chapter.save();

        res.redirect(syzoj.utils.makeUrl(['chapters', chapter.plan_id]));

    } catch (e) {
        syzoj.log(e);
        res.render('error', {
            err: e
        });
    }
});


app.get('/chapter/:id', async (req, res) => {
    try {
        if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
        
        let group_num = res.locals.user.group_num;
        if (syzoj.config.exam.indexOf(group_num) != -1) throw new ErrorMessage('比赛期间，限制访问。');

        let id = parseInt(req.params.id);
        
        let chapter = await Chapter.findById(id);

        let sections = await Contest.createQueryBuilder()
                                    .select('Contest.id')
                                    .addSelect('Contest.title')
                                    .addSelect('Contest.totproblems')
                                    .addSelect('Contest.start_time')
                                    .where('chapter_id = :id', {id})
                                    .orderBy("start_time", "ASC")
                                    .getMany();
        
        

        let user_id;
        if (res.locals.user) user_id = res.locals.user.id;
        let msg = {};
	msg.ac = 0;
	msg.tot = 0;
        for (let section of sections) {
            let contest_id = section.id;

            let contest = await Contest.findById(contest_id);
            let problems_id = await contest.getProblems();

            let contest_score = await ContestPlayer.createQueryBuilder()
                                              .select('ContestPlayer.score_details')
                                              .where('user_id = :user_id', {user_id})
                                              .andWhere('contest_id = :contest_id', {contest_id})
                                              .getOne();

            let ac_num = 0;
            if (contest_score) {
                for (let problemId in contest_score.score_details) {
                    if (problems_id.includes(parseInt(problemId)) && contest_score.score_details[problemId] && contest_score.score_details[problemId].score >= 100) ac_num++;
                }
            }   
            section.ac_num = ac_num;
	    msg.ac += ac_num;
	    msg.tot += section.totproblems;
        }
        
        res.render('chapter', {
            id,
            sections,
            title: chapter.title,
            msg
        });
    } catch (e) {
        syzoj.log(e);
        res.render('error', {
            err: e
        });
    }
});
