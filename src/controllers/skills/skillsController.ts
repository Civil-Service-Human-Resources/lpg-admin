import {NextFunction, Request, Response, Router} from 'express'
import {CsrsService} from '../../csrs/service/csrsService'
import * as csvtojson from 'csvtojson'
import {PlaceholderDateSkills} from '../../learning-catalogue/model/placeholderDateSkills'

class Choice {
	value: string

	constructor(val: string) {
		this.value = val
	}
}
class Profession {
	id: number
	name: string
	href: string
}

class Quiz {
	profession: Profession
	questions: Question[]
}

class Question {
	type: string
	value: string
	learningName: string
	learningReference: string
	theme: string
	why: string
	choices: Choice[]
	answers: Choice[]

	constructor(type: string, val: string, learnName: string, learnRef: string, theme: string, why: string, choices: Choice[], answers: Choice[]) {
		this.answers = answers
		this.choices = choices
		this.learningName = learnName
		this.learningReference = learnRef
		this.type = type
		this.value = val
		this.theme = theme
		this.why = why
	}
}

export class SkillsController {
	csrsService: CsrsService
	router: Router

	constructor(csrsService: CsrsService) {
		this.router = Router()
		this.configureRouterPaths()
		this.csrsService = csrsService
	}

	private configureRouterPaths() {
		this.router.get('/content-management/skills', this.getSkills())
		this.router.post('/content-management/skills', this.uploadAndProcess())
		this.router.get('/content-management/skills/success', this.getSkillsSuccess())
		this.router.get('/content-management/skills/generate-report', this.getSkillsReport())
		this.router.get('/content-management/skills/add-new-question', this.getAddQuestion())
		this.router.get('/content-management/skills/add-image', this.getImage())
	}

	getSkills() {
		return async (req: Request, res: Response, next: NextFunction) => {
			let professionID: any = null
			let professionName: any = null
			let professionQuestions: any = null
			await this.csrsService
				.getCivilServant()
				.then(civilServant => {
					if (civilServant.profession) {
						professionID = civilServant.profession.id
						professionName = civilServant.profession.name
					}
				})
				.catch(error => {
					next(error)
				})

			if (professionID != null) {
				await this.csrsService
					.getQuiz(professionID)
					.then(quiz => {
						if (quiz) {
							professionQuestions = quiz.questions
						}
					})
					.catch(error => {
						next(error)
					})
			}

			req.session!.save(() => {
				res.render('page/skills/skills', {professionID: professionID, professionName: professionName, professionQuestions: professionQuestions})
			})
		}
	}

	getAddQuestion() {
		return async (req: Request, res: Response, next: NextFunction) => {
			req.session!.save(() => {
				res.render('page/skills/add-new-question')
			})
		}
	}

	getImage() {
		return async (req: Request, res: Response, next: NextFunction) => {
			req.session!.save(() => {
				res.render('page/skills/add-image')
			})
		}
	}

	getSkillsReport() {
		return async (req: Request, res: Response, next: NextFunction) => {
			req.session!.save(() => {
				res.render('page/skills/generate-report', {
					placeholder: new PlaceholderDateSkills(),
				})
			})
		}
	}

	uploadAndProcess() {
		return async (req: Request, res: Response, next: NextFunction) => {
			let uploadedFileNotCSV: boolean = false

			// @ts-ignore
			const uploadedFile = req.files.file
			let fileExtension = uploadedFile.name.split('.')
			let fileType = fileExtension[fileExtension.length - 1]

			if (fileType.toLowerCase() !== 'csv') {
				uploadedFileNotCSV = true
				req.session!.sessionFlash = {uploadedFileNotCSV}
				req.session!.save(() => {
					res.redirect('/content-management/skills')
				})
			} else {
				await csvtojson()
					// @ts-ignore
					.fromString(req.files.file.data.toString('utf-8'))
					.then(async (questions: any) => {
						const opts = ['A', 'B', 'C', 'D', 'E']
						let questionToSend: Question[] = []

						questions.forEach((question: any) => {
							let choices: Choice[] = [],
								answers: Choice[] = []
							opts.forEach((o: string) => {
								if (question['CHOICE ' + o]) {
									choices.push(new Choice(question['CHOICE ' + o].replace(/(\r\n|\n|\r)/gm)))
								}
								if (question['ANSWER ' + o] === 'YES') {
									answers.push(new Choice(question['CHOICE ' + o].replace(/(\r\n|\n|\r)/gm)))
								}
							})
							questionToSend.push(
								new Question(
									question.TYPE,
									question.QUESTION,
									question['LEARNING NAME'],
									question['LEARNING REFERENCE'],
									question['THEME'],
									question['WHY'],
									choices,
									answers
								)
							)
						})

						const policyProfession = new Profession()

						await this.csrsService
							.getAreasOfWork()
							.then(professions => {
								professions.forEach((profession: Profession) => {
									if (profession.name.toLowerCase() === 'policy') {
										let professionHref = profession.href.split('/')
										let professionId = professionHref[professionHref.length - 1]
										policyProfession.id = parseInt(professionId, 0)
									}
								})
							})
							.catch(error => {
								next(error)
							})

						const quiz = new Quiz()
						quiz.profession = policyProfession
						quiz.questions = questionToSend

						await this.csrsService
							.postSkills(quiz)
							.then(() => {
								res.redirect('/content-management/skills/success')
							})
							.catch(error => {
								next(error)
							})
					})
			}
		}
	}

	getSkillsSuccess() {
		return async (req: Request, res: Response, next: NextFunction) => {
			res.render('page/skills/success')
		}
	}
}
