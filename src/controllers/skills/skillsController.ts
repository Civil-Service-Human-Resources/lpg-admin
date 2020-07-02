import {NextFunction, Request, Response, Router} from 'express'
import {CsrsService} from '../../csrs/service/csrsService'
import {PlaceholderDateSkills} from '../../learning-catalogue/model/placeholderDateSkills'
import {FormController} from '../formController'
import {Validator} from '../../learning-catalogue/validator/validator'
 import {QuestionFactory} from './questionFactory'
import {QuizFactory} from './quizFactory'
import {Question} from "./question"
import {Profession} from "./profession"
import {Answer} from "./answer"
import * as config from "../../config"

export class SkillsController implements FormController {
	csrsService: CsrsService
	validator: Validator<Question>
	router: Router
	questionFactory: QuestionFactory
	quizFactory: QuizFactory

	constructor(csrsService: CsrsService, questionFactory: QuestionFactory, quizFactory: QuizFactory, questionValidator: Validator<Question>) {
		this.router = Router()
		this.csrsService = csrsService
		this.validator = questionValidator
		this.questionFactory = questionFactory
		this.quizFactory = quizFactory
		this.configureRouterPaths()
	}

	private configureRouterPaths() {
		this.router.get('/content-management/skills', this.getSkills())
		this.router.get('/content-management/skills/add-new-question/success', this.getSkills())
		this.router.get('/content-management/skills/update-question/success', this.getSkills())
		this.router.get('/content-management/skills/generate-report', this.getSkillsReport())
		this.router.get('/content-management/skills/add-new-question', this.getAddQuestion())
		this.router.post('/content-management/skills/add-new-question', this.AddQuestion())
		this.router.get('/content-management/skills/delete-quiz', this.getDeleteQuiz())
		this.router.post('/content-management/skills/delete-quiz', this.deleteQuiz())
		this.router.get('/content-management/skills/edit-quiz-description', this.getEditQuitDescription())
		this.router.get('/content-management/skills/edit-quiz-description/success', this.getSkills())
		this.router.post('/content-management/skills/edit-quiz-description', this.editQuizDescription())
		this.router.get('/content-management/skills/:questionID/edit-question', this.getEditQuestion())
		this.router.post('/content-management/skills/:questionID/edit-question', this.EditQuestion())
		this.router.get('/content-management/skills/:questionID/delete-question', this.getDeleteQuestion())
		this.router.post('/content-management/skills/:questionID/delete-question', this.deleteQuestion())
		this.router.post('/content-management/skills/publish-quiz', this.publishSkills())
		this.router.get('/content-management/skills/publish-quiz/success', this.getSkills())
		this.router.get('/content-management/skills/publish-quiz/failure', this.getSkills())
		this.router.get('/content-management/skills/super-admin', this.getSkillsSuperAdmin())
		this.router.get('/content-management/skills/organisation-admin', this.getSkillsOrgAdmin())
		this.router.get('/content-management/skills/delete-questions/success', this.getSkills())
		this.router.get('/content-management/skills/:questionID/preview', this.previewQuestion())
	}

		getSkillsSuperAdmin() {
		return async (req: Request, res: Response, next: NextFunction) => {

			let quizzes: any = null

			await this.csrsService
				.getAllQuizes()
				.then(quizzesInfo => {
					quizzes = quizzesInfo
				})
				.catch(error => {
					next(error)
				})

			req.session!.save(() => {
				res.render('page/skills/skills-super-admin', {quizzes: quizzes})
			})
		}
	}

	getSkillsOrgAdmin() {
		return async (req: Request, res: Response, next: NextFunction) => {

			let quizzes: any = null
			let orgID: any = null

			await this.csrsService
				.getCivilServant()
				.then(civilServant => {
					if (civilServant.organisationalUnit) {
						orgID = civilServant.organisationalUnit.id
					}
				})
				.catch(error => {
					next(error)
				})

			await this.csrsService
				.getQuizesByOrg(orgID)
				.then(quizzesInfo => {
					quizzes = quizzesInfo
				})
				.catch(error => {
					next(error)
				})

			req.session!.save(() => {
				res.render('page/skills/skills-super-admin', {quizzes: quizzes})
			})

		}
	}

	previewQuestion() {
			return async (req: Request, res: Response, next: NextFunction) => {
				const questionID = req.params.questionID
				await this.csrsService
				.getQuestionbyID(questionID)
				.then( questionDTO => {
					const question = this.questionFactory.create(questionDTO)
					const answers = Object.values(question.answer.answers)
					const keys = ['A','B','C','D','E']
					req.session!.save(() => {
						res.render(`page/skills/quiz-question`, {
							question: question,
							answers: answers,
							keys: keys,
						})
					})
				})
				.catch(error => {
					next(error)
				})
		}
	}

	publishSkills() {
		return async (req: Request, res: Response, next: NextFunction) => {

			let profession = new Profession()

			await this.csrsService
				.getCivilServant()
				.then(civilServant => {
					if (civilServant.profession) {
						profession.id = civilServant.profession.id
					}
				})
				.catch(error => {
					next(error)
				})

			await this.csrsService
				.publishSkills(profession)
				.then(() => {
					req.session!.save(() => {
						res.redirect(`/content-management/skills/publish-quiz/success`)
					})
				})
				.catch(error => {
					res.redirect(`/content-management/skills/publish-quiz/failure`)
				})
		}
	}

	editQuizDescription() {
		return async (req: Request, res: Response, next: NextFunction) => {
			let professionID: any = null
			let description: any = req.body.description
			if (description != '') {
				await this.csrsService
					.getCivilServant()
					.then(civilServant => {
						if (civilServant.profession) {
							professionID = civilServant.profession.id
						}
					})
					.catch(error => {
						next(error)
					})

				let profession = new Profession();
				profession.id = professionID

				let data = {profession, description: description}

				await this.csrsService
					.editDescription(data, req.user)
					.then(() => {
						req.session!.save(() => {
							res.redirect(`/content-management/skills/edit-quiz-description/success`)
						})
					})
					.catch(error => {
						next(error)
					})
			} else {
				req.session!.save(() => {
					res.render('page/skills/edit-quiz-description', {
						error: 'Description is required',
					})
				})
			}
		}
	}


	AddQuestion() {
		return async (req: Request, res: Response, next: NextFunction) => {

			console.log("This is being called")

			let answer = new Answer()
			answer.answers = req.body.answers
			answer.correctAnswers = req.body.correctAnswers

			let data = {
				"value" : req.body.value,
				'answer': answer,
				"why" : req.body.why,
				'theme': req.body.theme,
				'suggestions': req.body.suggestions,
			}
			let errors = await this.validator.check(data)

			if (errors.size) {
				req.session!.sessionFlash = {
					errors,
					form: req.body,
				}
				return req.session!.save(() => {
					res.redirect('/content-management/skills/add-new-question')
				})
			} else {
				const question = this.questionFactory.create(req.body)
				let data = {professionId : 1, question}

				await this.csrsService
					.postQuestion(data, req.user)
					.then(() => {
						res.redirect('/content-management/skills/add-new-question/success')
					})
					.catch(error => {
						next(error)
					})
			}

		}
	}

	deleteQuiz() {
		return async (req: Request, res: Response, next: NextFunction) => {
			let professionID: any = null

			if (req.body.deleteQuiz == 'True') {
				await this.csrsService
					.getCivilServant()
					.then(civilServant => {
						if (civilServant.profession) {
							professionID = civilServant.profession.id
						}
					})
					.catch(error => {
						next(error)
					})

				await this.csrsService
					.deleteQuizByProfession(professionID, req.user)
					.then(() => {
						req.session!.save(() => {
							res.redirect(`/content-management`)
						})
					})
					.catch(error => {
						next(error)
					})
			} else if (req.body.deleteQuiz == 'False')  {
				req.session!.save(() => {
					res.redirect(`/content-management/skills`)
				})
			} else {
				req.session!.save(() => {
					res.render('page/skills/delete-quiz', {
						error: 'You must select an option below to continue',
					})
				})
			}
		}
	}

	deleteQuestion() {

		return async (req: Request, res: Response, next: NextFunction) => {

			if (req.body.deleteQuestion == 'True') {
				await this.csrsService
					.deleteQuestionbyID(req.params.questionID)
					.then(() => {
						req.session!.save(() => {
							res.redirect(`/content-management/skills/delete-questions/success`)
						})
					})
					.catch(error => {
						next(error)
					})
			} else if (req.body.deleteQuestion == 'False')  {
				req.session!.save(() => {
					res.redirect(`/content-management/skills/${req.params.questionID}/edit-question`)
				})
			} else {
				req.session!.save(() => {
					res.render('page/skills/delete-question', {
						error: 'You must select an option below to continue',
					})
				})
			}
		}


	}

	getDeleteQuestion() {
		return async (req: Request, res: Response, next: NextFunction) => {
			const questionID = req.params.questionID
			req.session!.save(() => {
				res.render('page/skills/delete-question', {
					questionID: questionID
				})
			})
		}
	}

	getDeleteQuiz() {
		return async (req: Request, res: Response, next: NextFunction) => {
			req.session!.save(() => {
				res.render('page/skills/delete-quiz')
			})
		}
	}

	getSkills() {
		return async (req: Request, res: Response, next: NextFunction) => {
			// @ts-ignore
			// const userRoles: any = req.user.roles
			//
			// if (userRoles.includes('ORGANISATION_REPORTER')) {
			// 	req.session!.save(() => {
			// 		res.redirect(`/content-management/skills/organisation-admin`)
			// 	})
			// } else if(userRoles.includes('CSHR_REPORTER')) {
			// 	req.session!.save(() => {
			// 		res.redirect(`/content-management/skills/super-admin`)
			// 	})
			// }

			let professionID: any = null
			let professionName: any = null
			let quiz: any = null
			let url: any = req.url
			let message: string = ""
			let errorMessage: string = ""
			let organisationalID: any = ""

			if(url == '/content-management/skills/add-new-question/success') {
				message = 'Question successfuly added'
			} else if (url == '/content-management/skills/update-question/success') {
				message = 'Your changes have been saved'
			} else if (url == '/content-management/skills/publish-quiz/success') {
				message = 'Your quiz has been published'
			} else if (url == '/content-management/skills/publish-quiz/failure') {
				errorMessage = 'You can only publish a quiz with at least 18 questions'
			} else if (url == '/content-management/skills/edit-quiz-description/success') {
				message = 'Your changes have been saved'
			} else if (url == '/content-management/skills/delete-questions/success') {
				message = 'Question deleted successfully'
			}

			await this.csrsService
				.getCivilServant()
				.then(civilServant => {
					if (civilServant.profession) {
						professionID = civilServant.profession.id
						professionName = civilServant.profession.name
						organisationalID = civilServant.organisationalUnit.id
						res.locals.professionID = professionID
						res.locals.organisationalID = organisationalID
					}
				})
				.catch(error => {
					next(error)
				})

			if (!professionID) {
				errorMessage = "Profession is not set, Please set your profession in your profile page."
			} else if (!organisationalID) {
				errorMessage = "Organisatoin is not set, Please set your profession in your profile page."
			} else if (!professionID && !organisationalID) {
				errorMessage = "Organisatoin is not set, Please set your profession in your profile page."
			}

			if (professionID != null) {
				let data = { profession: { id: professionID} , organisationId: organisationalID}

				await this.csrsService
					.createQuizByProfessionID(data, req.user)
					.then(quizInfo => {
						quiz = this.quizFactory.create(quizInfo.data)
					})
					.catch(error => {
						next(error)
					})
			}

			req.session!.save(() => {
				res.render('page/skills/skills', {quiz: quiz, professionName: professionName, message: message, errorMessage: errorMessage})
			})

		}
	}

	getEditQuestion() {
		return async (req: Request, res: Response, next: NextFunction) => {

			await this.csrsService
				.getQuestionbyID(req.params.questionID)
				.then( questionDTO => {
					const question = this.questionFactory.create(questionDTO)
					let keys = Object.values(questionDTO.answer.answers)

					req.session!.save(() => {
						res.render('page/skills/question', {
							question: question,
							keysAnswers: keys
						})
					})
				})
				.catch(error => {
					next(error)
				})
			}
	}

	EditQuestion() {
		return async (req: Request, res: Response, next: NextFunction) => {

			const question = this.questionFactory.create(req.body)

			await this.csrsService
				.editQuestion(question, req.user)
				.then( questionDTO => {
					req.session!.save(() => {
						res.redirect('/content-management/skills/update-question/success')
					})
				})
				.catch(error => {
					next(error)
				})
		}
	}

	getAddQuestion() {
		return async (req: Request, res: Response, next: NextFunction) => {
			req.session!.save(() => {
				res.render('page/skills/question', {
					courseCatalogueUrl: config.COURSE_CATALOGUE.url + '/media/skills/image',
				})
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


	getEditQuitDescription() {
		return async (req: Request, res: Response, next: NextFunction) => {

			let profession = new Profession()

			await this.csrsService
				.getCivilServant()
				.then(civilServant => {
					if (civilServant.profession) {
						profession.id = civilServant.profession.id
					}
				})
				.catch(error => {
					next(error)
				})

			await this.csrsService
				.getQuizByProfession(profession.id)
				.then( quiz => {
					req.session!.save(() => {
						res.render('page/skills/edit-quiz-description', {
							quiz: quiz
						})
					})
				})
				.catch(error => {
					res.redirect(`/content-management/skills/publish-quiz/failure`)
				})

		}
	}
}
