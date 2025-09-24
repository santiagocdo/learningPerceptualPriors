# # # # # # # # # # Visualization # # # # # # # # # # # # # # # # # # # # # ####
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
plotOneSim <- function (sim) {
  frame <- data.frame(sim$x$trial_structure,priors=sim$priors,
                      like=sim$like,p_detect=sim$p_detect)
  library(reshape2)
  for_plot <- melt(frame, measure.vars = c("priors","like","p_detect","probs"))
  message(paste("p(correct) =",round(mean(sim$likelihood),4)))
  (ggplot(for_plot, aes(x=trials,y=value,col=variable)) + 
      geom_point() +
      coord_cartesian(ylim = c(0,1)))
  
}



# # # # # # # # # # Other Functions # # # # # # # # # # # # # # # # # # # # ####
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# outersect opposite to intersect()
outersect <- function(x, y) {
  sort(c(setdiff(x, y),
         setdiff(y, x)))
}
# signal detection theory calculations
sdtModel <- function (data, events, confidence = NULL) {
  # NOTE: events must be ordered as follows: hit, FA, Ms, CR
  # SDT cell frequencies 
  sdtTable <- colSums(data$cells==t(matrix(rep(events,nrow(data)),ncol=nrow(data))))
  hit_rate <- sdtTable[1]/(sdtTable[1]+sdtTable[3]) # p(detection|signal)
  fa_rate <- sdtTable[2]/(sdtTable[2]+sdtTable[4]) # p(detection|noise)
  # http://wise.cgu.edu/wise-tutorials/tutorial-signal-detection-theory/signal-detection-d-defined-2/
  if (hit_rate == 0 | is.nan(hit_rate)) {
    hit_rate <- 1/nrow(data)
  } else if (hit_rate == 1) {
    hit_rate <- (nrow(data)-1)/nrow(data)
  }
  if (fa_rate == 0 | is.nan(fa_rate)) {
    fa_rate <- 1/nrow(data)
  } else if (fa_rate == 1) {
    fa_rate <- (nrow(data)-1)/nrow(data)
  }
  # estimate inverse variance of signal and noise distribution using confidence
  if (!is.null(confidence)) {
    # normalize (divided by the subjective confidence mean) confidence
    data[,confidence] <- data[,confidence]/mean(data[,confidence])
    library(dplyr)
    temp <- as.data.frame(data %>% group_by(cells) %>%
                            summarise(confidence=mean(confidence,na.rm=T)))
    # assuming all cells has at least one trial/observation
    if (length(intersect(temp$cells,events))!=length(events)) {
      # assuming one event is missing, then add row with it and 0
      temp <- rbind(temp,data.frame(cells=outersect(temp$cells,events),
                                    confidence=NA))
    }
    temp <- temp[order(temp$cells),]
    # hetocedasticity. Variance is the confidence-inverse and confidence is precision
    var_signal <- 1/mean(temp$confidence[temp$cells=="Hit"|temp$cells=="Ms"],na.rm=T)
    var_noise <- 1/mean(temp$confidence[temp$cells=="FA"|temp$cells=="CR"],na.rm=T)
  } else {
    # homocedasticity 
    var_signal <- 1
    var_noise <- 1
  }
  
  # sensitivity (d')
  sensitivity <- qnorm(hit_rate,0,var_signal) - qnorm(fa_rate,0,var_noise)
  # response criterion
  response_criterion  <- -1*(qnorm(hit_rate,0,var_signal) + qnorm(fa_rate,0,var_noise)) / 2
  # prepare output
  names(sdtTable) <- events
  # return list
  return(list(sensitivity=sensitivity,response_criterion=response_criterion,
              sdtTable=sdtTable,hit_rate=hit_rate,fa_rate=fa_rate,
              var=data.frame(signal=var_signal,noise=var_noise)))
}
# softmax used for PRL decision rule
softmax <- function (x, beta=1) exp(beta*x)/sum(exp(beta*x))
# logit and inverse logit function
logit <- function (innum, inverse) {
  # logit returns the logit or inverse logit of input. If inverse = 0 then perform logit
  if (inverse == 0) { 
    if (sum(innum < 0 | innum > 1) > 0) {
      message("Logit only defined for numbers between 0 and 1")
    }
    out <- -log((1/innum)-1)
  } else if (inverse == 1) {
    out <- 1/(1+exp(-innum))
  } else {
    warning("Inverse parameter must be 0 or 1")
    out <- NULL
  }
  return(out)
}
# merge fit .RData
mergeModels <- function(model_files, nda_vars = NULL) {
  # read data
  for (i in 1:length(model_files)) {
    # message(i)
    # load fitted data
    load(model_files[i])
    
    # in the case where load is a fit but not a recovery
    if (exists("fit") & !exists("recovery")) {
      # if there is a participant with two rows, get a warning
      if (nrow(fit$parameters)>1) {
        fit$parameters <- fit$parameters[1,]
        warning(paste("check src_subject_id",fit$mod_comparison$src_subject_id))
      }
      # combine all participants into param, i == 1 then create param
      if (i == 1) {
        # add nda vars? if null then nothing
        if (is.null(nda_vars)) {
          param <- cbind(fit$mod_comparison,fit$parameters)
        } else {
          # if nda_vars is a vector with the number of columns, then this: 
          param <- cbind(fit$bestMod$x$trial_structure[1,nda_vars],
                         fit$mod_comparison,fit$parameters)
        }
        # otherwise rbind all param with the ith participant
      } else {
        # add nda vars? if null then nothing
        if (is.null(nda_vars)) {
          param <- rbind(param,cbind(fit$mod_comparison,fit$parameters))
        } else {
          # if nda_vars is a vector with the number of columns, then thi: 
          param <- rbind(param,cbind(fit$bestMod$x$trial_structure[1,nda_vars],
                                     fit$mod_comparison,fit$parameters))
        }
      } # end if for rbind participants
      
      # in the case where load is not a fit but a recovery 
    } else if (!exists("fit") & exists("recovery")) {
      # combine all participants into param
      if (is.null(recovery$log_evidence)) {
        tmp <- recovery[recovery$sumLL == max(recovery$sumLL),]
      } else {
        tmp <- recovery[recovery$log_evidence == max(recovery$log_evidence),]
      }
      tmp <- tmp[1,]
      if (i == 1) {
        param <- tmp
      } else {
        param <- rbind(param, tmp)
      }
    }
  }
  # output
  return(param)
}
# model evidence
modelEvidence <- function (sumLL, H, parameters, priors) {
  # calculate Model Evidence via Laplace Approximation
  # Daw, N. D. (2011). Trial-by-trial data analysis using computational models. Decision making, affect, and learning: Attention and performance XXIII, 23(1), 3-38.
  # D = Data 
  # M = Model
  # theta = parameters; theta_hat = parameters at MLE
  # H = Hessian Matrix (describes the parametric space curvature at theta_hat)
  # Equation: 
  # log(P(D|M)) ~ log(P(D|M,theta_hat)) + log(P(theta_hat|M)) + n/2 * log(2*pi) + 0.5 * log(|H|)
  # Model Evidence ~ Likelihood + Prior + punish elements
  
  # sum log-likelihood from fit - log(P(D|M,theta_hat))
  log_likelihood <- sumLL
  # get MLE (_ml) parameters from fit - theta
  theta <- parameters[,grepl("_ml",colnames(parameters))]
  theta <- theta[!is.na(theta)]
  
  # get Hessian from fit H
  hessian <- H
  # Log of the determinant of the Hessian matrix - log(|H|)
  log_det_hessian <- determinant(hessian, logarithm = TRUE)$modulus[1]
  
  # get number of observations from fit - n
  n <- length(theta)
  
  # calculate priors evaluated at theta_hat: log(P(theta_hat|M))
  log_prior <- mvtnorm::dmvnorm(theta, mean = priors$mu, sigma = priors$Sigma, log = T)
  
  # model evidence
  log_evidence <- log_likelihood + log_prior + (n/2 * log(2 * pi)) + (0.5 * log_det_hessian)
  
  return(log_evidence)
}


# # # # # # # # # # Models and Fitting# # # # # # # # # # # # # # # # # # # ####
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# model 1 function
model1 <- function(param, x, simulation = T) {
  # NOTES:
  
  # parameters
  alpha <- param$alpha # learning rate
  nu <- param$nu # perceptual noise
  xi <- param$xi # weight between likelihood and priors (1 only perception)
  # inputs and responses
  chase <- as.matrix(x$chase)
  n_trials <- length(chase)
  # is a simulation?
  if (simulation) {
    report <- rep(NA,n_trials) 
  } else {
    report <- as.matrix(x$report)
  }
  # vectors size n_trials
  like <- p_report <- delta <- priors <- rep(NA,n_trials); priors[1] <- .5
  for (i in 1:n_trials) {
    # the likelihood contains perceptual noise (nu) where chase = 1, then (1-nu), chase = 0, then nu
    like[i] <- chase[i] * (1 - nu) + (1 - chase[i]) * nu
    loglike <- log(like[i] / (1 - like[i]))
    
    # priors are transformed in log(priors)
    logprior <- log(priors[i] / (1 - priors[i]))
  
    # logdetection is proportional to loglikelihood (seen) AND logprior
    logreport <- 1 * loglike + xi * logprior
    
    # probability of detection
    p_report[i] <- 1 / (1 + exp(-logreport))
    
    # detection is a Bernoulli experiment with p_report as parameter
    if (simulation) {
      report[i] <- rbinom(1, 1, p_report[i])
    }
    
    # prediction error
    delta[i] <- report[i] - priors[i]
    
    # update
    if (i < n_trials) {
      # model 1
      priors[i+1] <- priors[i] + alpha * delta[i]
    }
  } # end i loop
  
  # p(D|M) likelihood
  likelihood <- report*p_report+(1-report)*(1-p_report)
  # sum log-likelihood (higher the better)
  sumLL <- sum(log(likelihood))
  
  return(list(p_report=p_report, like=like, report=report, delta=delta, priors=priors,
              param=param, x=x, likelihood=likelihood, sumLL=sumLL))
}

# fit model 1
model1Fit <- function(toFit, fit_method = "optim", priors = NULL) {
  # start time
  start_time <- Sys.time()
  # number of parameters
  nPar <- length(toFit$bins)
  # raw trial structure for participant ith
  x <- toFit$x
  # responses (report), trial type (chase), and block (volatile or stable; condition)
  chase <- x$chase
  report <- x$report
  condition <- x$condition
  # valid responses. First 5 trials won't be analysed
  valid_trials <- !is.na(report); #valid_trials[1:5] <- F
  report_valid <- report[valid_trials]
  
  # number of trials total and valid
  nTrials <- length(report)
  nValidTrials <- sum(valid_trials)
  
  # select fitting method
  if (fit_method == "grid") {
    
    # bins for each parameter dimension
    bin1 <- toFit$bins[1]
    bin2 <- toFit$bins[2]
    bin3 <- toFit$bins[3]
    # parametric space
    min <- .005; max <- .995
    # parameters dimensions in the 'infinite' space
    vAlpha <- seq(logit(min,0),logit(max,0), (logit(max,0)-logit(min,0))/(bin1-1))
    vNu <- seq(logit(.001,0),logit(.499,0), (logit(.499,0)-logit(.001,0))/(bin2-1))
    vXi <- seq(logit(min,0),logit(max,0), (logit(max,0)-logit(min,0))/(bin3-1))
    
    # run parameters loop and extract softmax input (i.e. weights)
    like <- array(NA,dim = c(bin1,bin2,bin3))
    for (i in 1:bin1) {
      for (j in 1:bin2) {
        for (k in 1:bin3) {
          param <- data.frame(alpha=logit(vAlpha[i],1),
                              nu=logit(vNu[j],1),
                              xi=logit(vXi[k],1))
          # model task 1
          sim <- model1(param, x, simulation = F)
          # p(D|M)
          like[i,j,k] <- prod(sim$p_report*chase + (1-sim$p_report)*(1-chase))
        } # end k
      } # end j
    } # end i
    
    # image(apply(like,c(1,2),sum)) # dimension 1 (alpha) and 2 (nu)
    # image(apply(like,c(1,3),sum)) # dimension 1 (alpha) and 3 (xi)
    # image(apply(like,c(2,3),sum))
    # obtain posterior probability with uniform prior: p(M|D) = (p(D|M) * p(M)) / p(D)
    post_prob <- (like*1)/sum(like)
    
    # learning rate marginal
    alpha_marg <- apply(post_prob,1,sum)
    # learning rate maximum likelihood (ml)
    alpha_ml <- as.vector(logit(vAlpha[which.max(alpha_marg)], 1))
    # learning rate weighted mean
    alpha_wm <- as.vector(logit(vAlpha %*% alpha_marg, 1))
    # learning rate variance
    alpha_var <- as.vector(logit( ((vAlpha - logit(alpha_wm,0))^2) %*% alpha_marg, 1))
    
    # nu marginal
    nu_marg <- apply(post_prob,2,sum)
    # nu maximum likelihood (ml)
    nu_ml <- as.vector(logit(vNu[which.max(nu_marg)],1))
    # nu weighted mean
    nu_wm <- as.vector(logit(vNu %*% nu_marg, 1))
    # nu variance
    nu_var <- as.vector(logit( ((vNu - logit(nu_wm,0))^2) %*% nu_marg, 1))
    
    # xi marginal
    xi_marg <- apply(post_prob,3,sum)
    # xi maximum likelihood (ml)
    xi_ml <- as.vector(logit(vXi[which.max(xi_marg)], 1))
    # xi weighted mean
    xi_wm <- as.vector(logit(vXi %*% xi_marg, 1))
    # xi variance
    xi_var <- as.vector(logit( ((vXi - logit(xi_wm,0))^2) %*% xi_marg, 1))
    
    # problematic fit?
    problem_fit <- ifelse((which.max(alpha_marg)==bin1|which.max(alpha_marg)==1)|
                            (which.max(nu_marg)==bin2|which.max(nu_marg)==1)|
                            (which.max(xi_marg)==bin3|which.max(xi_marg)==1),T,F)
    
    # use best parameters to estimate sumLL, BIC, and hit_rate
    bestMod <- model1(data.frame(alpha = alpha_wm, nu=nu_wm, xi=xi_wm), x, simulation = F)
    # sum log-likelihood (higher the better)
    bestMod_p_report <- bestMod$p_report[valid_trials]
    sumLL <- sum(log(bestMod_p_report*report_valid + (1-bestMod_p_report)*(1-report_valid)))
    # Bayesian Information Criterion (lower the better)
    BIC <- (nPar * log(nValidTrials)) - (2 * sumLL)
    # Hit Rate
    hit_rate <- mean(bestMod_p_report*report_valid + (1-bestMod_p_report)*(1-report_valid))
    # set output list
    parameters <- data.frame(alpha_ml=alpha_ml,alpha_wm=alpha_wm,alpha_var=alpha_var,
                             nu_ml=nu_ml,nu_wm=nu_wm,nu_var=nu_var,
                             xi_ml=xi_ml,xi_wm=xi_wm,xi_var=xi_var)
    # end time
    end_time <- Sys.time()
    fit_duration <- end_time - start_time
    
    # model specifications
    mod_comparison <- data.frame(id = toFit$id, sumLL,
                                 BIC, hit_rate, fit_duration, valid_trials = nValidTrials,
                                 problem_fit, fit_method, bins = paste(toFit$bins, collapse = ","))
    # create output list
    output <- list(parameters = parameters, mod_comparison = mod_comparison, bestMod = bestMod,
                   marginals = data.frame(alpha_marg, nu_marg, xi_marg),
                   post_prob = post_prob)
    
  } else if (fit_method == "optim") {
    
    # how many restarts?
    restarts <- toFit$restarts
    # random starts
    random_starts <- matrix(rnorm(nPar*restarts,0,2),ncol=nPar)
    # optim method
    optim_method <- "BFGS"
    # loop restarts
    for (j in 1:restarts) {
      # tryCatch is to ignore errors so the code does not break
      fit_results <- tryCatch({
        optim(par      = random_starts[j,], 
              fn       = model1map, 
              method   = optim_method, 
              hessian  = T,
              x        = x,
              priors   = priors)
      }, error = function(e) {
        if (exists("fit_results")) {fit_results <- fit_results}  # Ignore the error and the previous fit
      }, warning = function(w) {
        if (exists("fit_results")) {fit_results <- fit_results}  # Ignore the warning and the previous fit
      })
      if (!is.null(fit_results)) {
        if (j == 1 | !exists("fits")) {
          fits <- data.frame(restart=j,t(unlist(fit_results)))
        } else {
          fits <- rbind(fits, data.frame(restart=j,t(unlist(fit_results))))
        }
      }
    }
    # only test fits that converged correctly
    fits <- fits[fits$convergence == 0,]
    # select best restart (optim minimizes, thus get the one with lower -LogLik)
    fits <- fits[order(fits$value),]; best <- fits[1,]
    # is there any hessian?
    if (any(grepl("hessian",colnames(best)))) {
      H <- matrix(as.numeric(best[,grepl("hessian",colnames(best))]),nPar)
      # diagonal of the H-1 (inverse hessian_matrix) is the variance of the parameters at the MLE
      if (any(diag(H)==0)) { # if diagonal is 0 we cannot get the inverse H
        invH <- matrix(NA,nPar,nPar)
      } else {
        invH <- solve(H) # inverse of H
      }
    } else { # if there is no hessian in best, then NA for H and its inverse
      H <- NA
      invH <- matrix(NA,nPar,nPar)
    }
    
    # use best parameters to estimate sumLL, BIC, and hit_rate
    bestMod <- model1(data.frame(alpha=logit(best$par1,1), 
                                 nu=logit(best$par2,1),
                                 xi=logit(best$par3,1)), x, simulation = F)
    # sum log-likelihood (higher the better)
    bestMod_p_report <- bestMod$p_report[valid_trials]
    sumLL <- sum(log(bestMod_p_report*report_valid + (1-bestMod_p_report)*(1-report_valid)))
    # Bayesian Information Criterion (lower the better)
    BIC <- (nPar * log(nValidTrials)) - (2 * sumLL)
    # Hit Rate
    hit_rate <- mean(bestMod_p_report*report_valid + (1-bestMod_p_report)*(1-report_valid))
    # set output list
    parameters <- data.frame(alpha_ml=best$par1, alpha_var=invH[1,1],
                             nu_ml=best$par2, nu_var=invH[2,2],
                             xi_ml=best$par3, xi_var=invH[3,3])
    # model evidence with Laplace Approximation
    if (!is.null(priors)) {
      log_evidence <- modelEvidence(sumLL, H, parameters, priors)
    } else {log_evidence <- NA}
    
    # end time
    end_time <- Sys.time()
    fit_duration <- end_time - start_time
    
    # model specifications
    mod_comparison <- data.frame(id = toFit$id, sumLL, BIC, log_evidence, hit_rate, 
                                 fit_duration, valid_trials = nValidTrials,
                                 problem_fit = any(is.na(invH)), # if we could not get the inverse H
                                 fit_method = paste0(fit_method,"-",optim_method),
                                 restarts = restarts, success_restarts = nrow(fits))
    # create output list
    output <- list(parameters = parameters, mod_comparison = mod_comparison, 
                   hessian = H, bestMod = bestMod, priors = priors)
  }
  return(output)
} # end fitting function

# calculate likelihood model 1 (with priors)
model1map <- function(par, x, priors = NULL) {
  # parameters
  alpha <- logit(par[1],1) # learning rate
  nu <- logit(par[2],1) # perceptual noise
  xi <- logit(par[3],1) # weight between likelihood and priors (1 only perception)
  # priors
  if (!is.null(priors)) {
    mu <- priors$mu
    Sigma <- priors$Sigma
    # Likelihood of current beta according to prior distribution
    prior <- mvtnorm::dmvnorm(c(par[1], par[2], par[3]), mean = mu, sigma = Sigma)
  } else {prior <- 1}
  # inputs and responses
  chase <- as.matrix(x$chase)
  n_trials <- length(chase)
  report <- as.matrix(x$report)
  # vectors size n_trials
  like <- p_report <- delta <- priors <- rep(NA,n_trials); priors[1] <- .5
  for (i in 1:n_trials) {
    # the likelihood contains perceptual noise (nu) where chase = 1, then (1-nu), chase = 0, then nu
    like[i] <- chase[i] * (1 - nu) + (1 - chase[i]) * nu
    loglike <- log(like[i] / (1 - like[i]))
    # priors are transformed in log(priors)
    logprior <- log(priors[i] / (1 - priors[i]))
    # logdetection is proportional to loglikelihood (seen) AND logprior
    logreport <- 1 * loglike + xi * logprior
    # probability of detection
    p_report[i] <- 1 / (1 + exp(-logreport))
    # prediction error
    delta[i] <- report[i] - priors[i]
    # update
    if (i < n_trials) {
      # model 1
      priors[i+1] <- priors[i] + alpha * delta[i]
    }
  } # end i loop
  # p(D|M) likelihood
  likelihood <- report*p_report + (1-report)*(1-p_report)
  # perfect model
  # likelihood <- log(rep(1,n_trials))
  # # chance model
  # likelihood <- log(rep(.5,n_trials))
  # log likelihood x priors 
  loglikelihood <- log(likelihood * prior)
  # return the summed (minus) log-likelihood, because optim minimizes by default
  -sum(loglikelihood)
}

model0sim <- function(raw_data, participants) {
  
  for (i in 1:length(participants)) {#message(i)
    # read one participant
    one_subj <- raw_data[raw_data$prolificID==participants[i],]
    
    # create x and toFit list
    x <- list()
    # add trial structure
    x$trial_structure <- one_subj
    # also chase and detect
    x$chase <- ifelse(one_subj$chase,1,0)
    x$detect <- one_subj$detect
    
    # prepare list for fitting function
    toFit <- list(id = participants[i], x = x)
    
    # responses in: input vectors (choices) and in actual responses (1, 2, or 3)
    detect <- one_subj$detect
    # number of trials total and valid
    nTrials <- nrow(x$trial_structure)
    valid_trials <- !is.na(x$chase); #valid_trials[1:5] <- F
    nValidTrials <- sum(valid_trials)
    detectValid <- detect[valid_trials]
    # use best parameters to estimate maxLL, BIC, and hit_rate
    bestMod <- model0(x)
    # sum log-likelihood (higher the better)
    bestModPDetect <- bestMod$p_detect
    sumLL <- sum(log(bestModPDetect*detectValid  + (1-bestModPDetect)*(1-detectValid )))
    # Bayesian Information Criterion (lower the better)
    BIC <- (3 * log(nValidTrials)) - (2 * sumLL)
    # Hit Rate
    hit_rate <- mean(bestModPDetect*detectValid + (1-bestModPDetect)*(1-detectValid))
    
    # Signal Detection Theory
    tmp <- data.frame(detect=bestMod$detect, chase=x$chase)
    tmp$cells <- paste0(tmp$detect,tmp$chase)
    sdt <- sdtModel(data=tmp, events=c("11","10","01","00"))
    
    # model specifications
    mod_comparison <- data.frame(id = toFit$id, sumLL, BIC, hit_rate, 
                                 valid_trials = nValidTrials)
    # create output list
    output <- list(mod_comparison = mod_comparison, bestMod = bestMod)
    if (i == 1) {
      outputAll <- data.frame(output$mod_comparison,as.data.frame(t(unlist(sdt))))
    } else {
      outputAll <- rbind(outputAll,data.frame(output$mod_comparison,as.data.frame(t(unlist(sdt)))))
    }
  }
  return(outputAll)
}

# nullHypothesisDistribution <- function (how_many_times) {
#   p_correct <- as.vector(NA)
#   for (i in 1:how_many_times) {
#     # how many trials
#     n_trials <- 36
#     # simulate probability of detect
#     p_detect <- runif(n_trials)
#     # simulate random correct trials
#     correct <- rbinom(n_trials,1,p_detect)
#     # average
#     p_correct[i] <- mean(correct)
#   }
#   return(p_correct)
# }
# p_correct <- nullHypothesisDistribution(5000)
# hist(p_correct,50)
