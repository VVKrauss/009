                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-primary-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Нет ближайших мероприятий
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Запланируйте новое мероприятие
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Предстоящие мероприятия */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-primary-500" />
                    Предстоящие мероприятия
                  </h2>
                  <div className="flex items-center gap-4">
                    <ViewToggle isListView={isListView} onToggle={setIsListView} />
                    <button
                      onClick={() => setActiveTab('upcoming')}
                      className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Смотреть все
                    </button>
                  </div>
                </div>
                {loading.upcoming ? (
                  <LoadingSpinner />
                ) : events.upcoming.length > 0 ? (
                  <div>
                    {isListView ? (
                      <div className="space-y-3">
                        {events.upcoming.slice(0, 6).map((event) => (
                          <EventListItem key={event.id} event={event} />
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {events.upcoming.slice(0, 6).map((event) => (
                          <EventCard key={event.id} event={event} isCompact={true} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-primary-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Нет предстоящих мероприятий
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Создайте новое мероприятие
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Calendar className="w-6 h-6 mr-3 text-primary-500" />
                  Предстоящие мероприятия
                </h2>
                <ViewToggle isListView={isListView} onToggle={setIsListView} />
              </div>
              {loading.upcoming ? (
                <LoadingSpinner />
              ) : events.upcoming.length > 0 ? (
                <div className="space-y-8">
                  {isListView ? (
                    <div className="space-y-3">
                      {events.upcoming.map((event) => (
                        <EventListItem key={event.id} event={event} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                      {events.upcoming.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                  {pagination.upcoming.hasMore && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => loadMore('upcoming')}
                        disabled={loadingMore.upcoming}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                      >
                        {loadingMore.upcoming ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Загрузка...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-5 h-5 mr-2" />
                            Показать еще 10 мероприятий
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-12 h-12 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Нет предстоящих мероприятий
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Создайте новое мероприятие, чтобы начать привлекать участников
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <TrendingUp className="w-6 h-6 mr-3 text-primary-500" />
                  Прошедшие мероприятия
                </h2>
                <ViewToggle isListView={isListView} onToggle={setIsListView} />
              </div>
              
              {loading.past ? (
                <LoadingSpinner />
              ) : events.past.length > 0 ? (
                <div className="space-y-8">
                  {isListView ? (
                    <div className="space-y-3">
                      {events.past.map((event) => (
                        <EventListItem key={event.id} event={event} isPast={true} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                      {events.past.map((event) => (
                        <EventCard key={event.id} event={event} isPast={true} />
                      ))}
                    </div>
                  )}
                  
                  {pagination.past.hasMore && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => loadMore('past')}
                        disabled={loadingMore.past}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                      >
                        {loadingMore.past ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Загрузка...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-5 h-5 mr-2" />
                            Показать еще 10 мероприятий
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-12 h-12 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Нет прошедших мероприятий
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Здесь появится история ваших завершенных мероприятий
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsStatistics;