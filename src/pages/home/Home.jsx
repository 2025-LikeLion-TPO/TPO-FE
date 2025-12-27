import React, { useEffect, useState } from 'react';
import './Home.scss';

const Home = () => {
  // 오늘 날짜
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  // 임시 지인 데이터 (지인 API 명세가 없어서 그대로 둠)
  const friends = [
    {
      id: 1,
      name: '강성신',
      degree: 30,
      relation: '대리님',
      sentCount: 3,
      receivedCount: 4,
      image: '/images/profile1.png',
    },
    {
      id: 2,
      name: '강성신',
      degree: 22,
      relation: '대학동기',
      sentCount: 4,
      receivedCount: 2,
      image: '/images/profile1.png',
    },
    {
      id: 3,
      name: '강성신',
      degree: 28,
      relation: '대리님',
      sentCount: 1,
      receivedCount: 3,
      image: '/images/profile1.png',
    },
  ];

  // --- 오늘 이벤트: /events/today 연동 ---
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  useEffect(() => {
    const fetchTodayEvents = async () => {
      try {
        setLoadingEvents(true);
        setEventsError(null);

        const res = await fetch('/events/today');
        if (!res.ok) {
          throw new Error(`GET /events/today 실패 (status: ${res.status})`);
        }

        const data = await res.json();

        // TODO: 실제 API 응답 구조에 맞게 필드 매핑 수정하기
        // 현재는 data가 이벤트 배열이라고 가정
        const normalized = (data.events || data).map((ev) => ({
          id: ev.id,
          title: ev.title,
          // 날짜 형식: 'YYYY-MM-DD' 또는 ISO 문자열이라고 가정
          date: ev.date,
          personName: ev.personName || ev.person || '',
          relation: ev.relation || '',
          degree: ev.degree ?? ev.temp ?? 0,
          image: ev.imageUrl || '/images/profile1.png',
        }));

        setEvents(normalized);
      } catch (err) {
        console.error(err);
        setEventsError(err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchTodayEvents();
  }, []);

  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const calcDdayText = (eventDate) => {
    const diff =
      (startOfDay(eventDate).getTime() - startOfDay(today).getTime()) /
      (1000 * 60 * 60 * 24);

    const days = Math.round(diff);

    if (days === 0) return 'D-DAY';
    if (days > 0) return `D-${days}`;
    return `D+${Math.abs(days)}`;
  };

  return (
    <div className="home">
      <div className="hello">
        <h1>
          반가워요 <span className="name">멋사님</span>! <br />
          오늘, 누구를 챙겨야 할까요?
        </h1>
        <p>상황과 친밀도에 맞춰 센스있는 가이드를 알려드려요.</p>
      </div>

      <section className="people">
        <div className="people-header">
          <h2>최근 교류한 지인</h2>
          <button className="people-all-btn">지인 전체보기</button>
        </div>

        <div className="people-list">
          {friends.map((f) => (
            <article key={f.id} className="people-card">
              <p className="people-degree">
                우리의 친밀도 <span>{f.degree}°</span>
              </p>

              <div className="people-avatar-wrap">
                <img src={f.image} alt={f.name} className="people-avatar" />
              </div>

              <p className="people-name">{f.name}</p>

              <div className="people-meta">
                <div className="meta-col">
                  <p className="label">관계</p>
                  <p className="value relation">{f.relation}</p>
                </div>
                <div className="meta-col">
                  <p className="label">챙긴 횟수</p>
                  <p className="value">{f.sentCount}회</p>
                </div>
                <div className="meta-col">
                  <p className="label">받은 횟수</p>
                  <p className="value">{f.receivedCount}회</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 오늘 이벤트 섹션 */}
      <section className="events">
        <div className="events-header">
          <h2>오늘 이벤트</h2>
          <button className="events-add-btn">새 이벤트 추가</button>
        </div>

        <div className="events-list">
          {loadingEvents && (
            <article className="event-card empty">
              <div className="event-left-bar" />
              <div className="event-body">
                <p className="event-empty-text">오늘 이벤트를 불러오는 중이에요…</p>
              </div>
            </article>
          )}

          {!loadingEvents && eventsError && (
            <article className="event-card empty">
              <div className="event-left-bar" />
              <div className="event-body">
                <p className="event-empty-text">
                  오늘 이벤트를 불러오지 못했어요.
                </p>
              </div>
            </article>
          )}

          {!loadingEvents && !eventsError && events.length === 0 && (
            <article className="event-card empty">
              <div className="event-left-bar" />
              <div className="event-body">
                <p className="event-date">
                  <span className="event-month">{todayMonth}월</span>{' '}
                  <span className="event-day">{todayDay}일</span>
                </p>

                <p className="event-empty-text">
                  오늘은 이벤트가 존재하지 않아요.
                </p>
              </div>
              <button className="event-more">⋮</button>
            </article>
          )}

          {!loadingEvents &&
            !eventsError &&
            events.length > 0 &&
            events.map((e) => {
              const eventDate = new Date(e.date); // 문자열 → Date

              return (
                <article key={e.id} className="event-card">
                  <div className="event-left-bar" />

                  <div className="event-body">
                    <div className="event-date-row">
                      <p className="event-date">
                        <span className="event-month">
                          {eventDate.getMonth() + 1}월
                        </span>{' '}
                        <span className="event-day">
                          {eventDate.getDate()}일
                        </span>
                      </p>

                      <span className="event-dday">
                        {calcDdayText(eventDate)}
                      </span>
                    </div>

                    <div className="event-content">
                      <div className="event-avatar-wrap">
                        <img
                          src={e.image}
                          alt={e.personName}
                          className="event-avatar"
                        />
                      </div>

                      <div className="event-texts">
                        <p className="event-title">{e.title}</p>
                        <div className="event-sub">
                          <span className="event-person">{e.personName}</span>
                          <span className="event-relation">{e.relation}</span>
                          <span className="event-degree">{e.degree}°</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="event-more">⋮</button>
                </article>
              );
            })}
        </div>
      </section>
    </div>
  );
};

export default Home;
