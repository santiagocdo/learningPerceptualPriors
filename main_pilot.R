# Remove all of the elements currently loaded in R
rm(list=ls(all=TRUE))

# read pilot data
dat <- read.csv("data/paranoiachasing-bytrial(plt1-09-11-2025).csv")
dat <- read.csv("data/paranoiachasing-bytrial(plt2-09-24-2025).csv")

# subject vector
subjs <- unique(dat$prolificID )[order(unique(dat$prolificID))]
# number of subjects
nSubj <- length(subjs)
# number of trials
# nTrial <- length(unique(dat$trial))
# # create arrays for stan
# chase <- report <- condition <- array(NA,dim=c(nTrial, nSubj))
# for (i in 1:nSubj) {
#   # get one subject and the 8 conditions
#   tmp <- dat[dat$prolificID == subjs[i],]
#   # store information into arrays
#   chase[,i] <- tmp$chasingIsPresent
#   report[,i] <- tmp$reportChasing
#   condition[,i] <- ifelse(tmp$blockVolatility == "volatile", 1, 0)
# }; remove(tmp)
# # create list to feed stan
# to_fit_stan <- list(nSubj = nSubj, nTrial = nTrial,
#                     chase = chase, report = report, condition = condition)
# libraries
# if (!require(rstan)) {install.packages("rstan")}; library(rstan)
# rstan_options(auto_write = TRUE)
# options(mc.cores = parallel::detectCores())
# fit <- stan(
#   file = "stan_hier_mod1.stan",
#   data = to_fit_stan,
#   chains = 4,      # Number of MCMC chains
#   iter = 2000,     # Total iterations per chain (warmup + sampling)
#   warmup = 1000,   # Warmup iterations per chain (discarded for inference)
#   # thin = 1,        # Thinning rate (take every 'thin' sample)
#   # seed = 456,       # Seed for reproducible MCMC sampling
#   control = list(adapt_delta = .9, max_treedepth = 12)
# )
# # diagnosis
# rstan::check_treedepth(fit)
# rstan::check_energy(fit)
# rstan::check_divergences(fit)
# save(fit, file = "mod1_stan.RData")








# # # # # # # # # # Model Fit # # # # # # # # # # # # # # # # # # # # # # # ####
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# functions
source("functions.R")
# which method will you use to fit? grid search (slower) or MLE (faster)
fit_method <- "grid" # "optim" OR "grid"
# how many restarts for the "optim" method
restarts <- 50
# how many bins per parameter's dimension
bins <- c(30,30,30)

# libraries
if (!require(foreach)) {install.packages("foreach")}; library(foreach)
if (!require(doParallel)) {install.packages("doParallel")}; library(doParallel)
# start time
start_time <- Sys.time()
# Set up parallel processing
# num_cores <- detectCores() - 4 # Adjust as needed
# cl <- makeCluster(num_cores)
# registerDoParallel(cl)
# Parallelize the loop using foreach
# foreach(i = 1:nSubj) %dopar% {
for (i in 1:nSubj) {message(i)
  # read one participant
  tmp <- dat[dat$prolificID==subjs[i],]
  
  
  # # # # Condition Volatile # # # #
  # one_subj <- tmp[tmp$blockVolatility=="stable",]
  one_subj <- tmp[tmp$blockIsVolatile==1,]
  
  
  # # Behaviour # # 
  # calculate performance of this simulation
  sdt_s <- sdtModel(data = data.frame(cells=paste0(one_subj$report, one_subj$chasingIsPresent)), 
                    events = c("11","10","01","00"))
  # # Model Fit # #
  # create x and toFit list
  x<-list()
  # add trial structure
  x$trial_structure <- one_subj
  # also chase and detect
  x$chase <- one_subj$chasingIsPresent
  x$report <- one_subj$reportChasing
  # prepare list for fitting function
  toFit <- list(id = subjs[i], condition="stable", x = x, 
                restarts = restarts, bins = bins)
  # fit model
  fit_s <- model1Fit(toFit, fit_method)
  # save
  save(fit_s, file = paste0("individual_fits/mod1_" ,fit_method, "_stable_", subjs[i], ".RData"))
  
  
  # # # # Condition Volatile # # # # 
  # one_subj <- tmp[tmp$blockVolatility=="volatile",]
  one_subj <- tmp[tmp$blockIsVolatile==0,]
  
  # # Behaviour # # 
  # calculate performance of this simulation
  sdt_v <- sdtModel(data = data.frame(cells=paste0(one_subj$report, one_subj$chasingIsPresent)), 
                    events = c("11","10","01","00"))
  
  # create x and toFit list
  x<-list()
  # add trial structure
  x$trial_structure <- one_subj
  # also chase and detect
  x$chase <- one_subj$chasingIsPresent
  x$report <- one_subj$reportChasing
  # prepare list for fitting function
  toFit <- list(id = subjs[i], condition="volatile", x = x, 
                restarts = restarts, bins = bins)
  # fit model
  fit_v <- model1Fit(toFit, fit_method)
  # save
  save(fit_v, file = paste0("individual_fits/mod1_" ,fit_method, "_volatile_", subjs[i], ".RData"))
  
  
  # add adecuate column names
  sdt_s <- as.data.frame(t(unlist(sdt_s)))
  sdt_v <- as.data.frame(t(unlist(sdt_v)))
  # colnames(sdt_s) <- paste0(colnames(sdt_s),"_s")
  # colnames(sdt_v) <- paste0(colnames(sdt_v),"_v")
  
  tmp <- rbind(data.frame(fit_s$mod_comparison,fit_s$parameters,sdt_s, condition="stable", 
                          tmp[1,colnames(dat)[11:ncol(dat)]]),
               data.frame(fit_v$mod_comparison,fit_v$parameters,sdt_v, condition="volatile", 
                          tmp[1,colnames(dat)[11:ncol(dat)]]))
  
  if (i == 1) {
    wide_format <- tmp
  } else {
    wide_format <- rbind(wide_format,tmp)
  } 
}
# Clean up parallel processing
# stopCluster(cl)
# registerDoSEQ() # Revert to single-threaded processing
# end time
end_time <- Sys.time()
# how long was it?
end_time - start_time



# hit rate for model fit and sdt. So create mean_lik and keep sdt as hit_rate 
colnames(wide_format)[4] <- "mean_lik"
colnames(wide_format)[25] <- "hit_rate"



# print wide format csv
# write.csv(wide_format, "wide_format_p2.csv", row.names = F)
wide_format <- read.csv("wide_format_p2.csv")


# wide_format$p_corr <- (wide_format$sdtTable.00+wide_format$sdtTable.11)/48
cor.test(wide_format$spiritual.events,wide_format$fa_rate)
cor.test(wide_format$R.GPTS.persecution,wide_format$fa_rate)
cor.test(wide_format$R.GPTS.reference,wide_format$fa_rate)



wide_format$paranoia <- ifelse(wide_format$R.GPTS.persecution>10,"high","low")
wide_format$se_grp <- ifelse(wide_format$spiritual.events>
                               median(wide_format$spiritual.events),"high","low")



library(reshape2)
for_plot <- melt(wide_format, measure.var=c("sumLL","mean_lik","alpha_wm","nu_wm",
                                            "xi_wm","sensitivity","response_criterion",
                                            "hit_rate","fa_rate"))
t.test(sumLL ~ condition, wide_format)
t.test(mean_lik ~ condition, wide_format)
t.test(alpha_wm ~ condition, wide_format)
t.test(nu_wm ~ condition, wide_format)
t.test(xi_wm ~ condition, wide_format)
# t.test(p_corr ~ condition, wide_format)
t.test(sensitivity ~ condition, wide_format)
t.test(response_criterion ~ condition, wide_format)
t.test(hit_rate ~ condition, wide_format)
t.test(fa_rate ~ condition, wide_format)

anova(lm(sumLL ~ condition*paranoia, wide_format))
anova(lm(mean_lik ~ condition*paranoia, wide_format))
anova(lm(alpha_wm ~ condition*paranoia, wide_format))
anova(lm(nu_wm ~ condition*paranoia, wide_format))
anova(lm(xi_wm ~ condition*paranoia, wide_format))
# anova(lm(p_corr ~ condition*paranoia, wide_format))
anova(lm(sensitivity ~ condition*paranoia, wide_format))
anova(lm(response_criterion ~ condition*paranoia, wide_format))
anova(lm(hit_rate ~ condition*paranoia, wide_format))
anova(lm(fa_rate ~ condition*paranoia, wide_format))

anova(lm(sumLL ~ condition*se_grp, wide_format))
anova(lm(mean_lik ~ condition*se_grp, wide_format))
anova(lm(alpha_wm ~ condition*se_grp, wide_format))
anova(lm(nu_wm ~ condition*se_grp, wide_format))
anova(lm(xi_wm ~ condition*se_grp, wide_format))
# anova(lm(p_corr ~ condition*se_grp, wide_format))
anova(lm(sensitivity ~ condition*se_grp, wide_format))
anova(lm(response_criterion ~ condition*se_grp, wide_format))
anova(lm(hit_rate ~ condition*se_grp, wide_format))
anova(lm(fa_rate ~ condition*se_grp, wide_format))

ggplot(wide_format, aes(x=condition,y=sensitivity,col=se_grp)) + stat_summary()

library(ggplot2)
p2 <- ggplot(for_plot, aes(x = condition, y = value, col=se_grp)) + 
  stat_summary(position = position_dodge(.5)) +
  # stat_compare_means(method = "t.test", label = "p.signif") + 
  facet_wrap(variable ~ ., scales = "free_y")

ggpubr::ggarrange(p1,p2)



# # # # # # # # # # Recovery and Validation # # # # # # # # # # # # # # # # ####
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 


