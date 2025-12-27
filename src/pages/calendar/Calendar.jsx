import React, { useEffect, useMemo, useState } from 'react';
import './Calendar.scss';

const pad2 = (n) => String(n).padStart(2, '0');
const toKey = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const addMonths = (date, diff) =>
    new Date(date.getFullYear(), date.getMonth() + diff, 1);

const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const buildMonthGrid = (anchor) => {
    const y = anchor.getFullYear();
    const m = anchor.getMonth();

    const first = new Date(y, m, 1);
    const startOffset = first.getDay();
    const start = new Date(y, m, 1 - startOffset);

    let cells = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate() + i
        );
        cells.push({ date: d, inMonth: d.getMonth() === m, key: toKey(d) });
    }

    while (cells.slice(0, 7).every((c) => !c.inMonth)) cells = cells.slice(7);
    while (cells.slice(-7).every((c) => !c.inMonth)) cells = cells.slice(0, -7);

    return cells;
};

const startOfWeekSun = (d) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - x.getDay()); // 일요일 시작
    return x;
};

const buildWeekRow = (anyDate) => {
    const start = startOfWeekSun(anyDate);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate() + i
        );
        return { date: d, key: toKey(d) };
    });
};

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

const Calendar = () => {
    const today = useMemo(() => new Date(), []);
    const [anchor, setAnchor] = useState(
        () => new Date(today.getFullYear(), today.getMonth(), 1)
    );
    const [selected, setSelected] = useState(() => today);

    const [view, setView] = useState('calendar');

    // 월별 이벤트 (캘린더, 날짜별 목록용)
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);

    // 다가오는 이벤트 (/events/upcoming)
    const [upcoming, setUpcoming] = useState([]);
    const [upcomingLoading, setUpcomingLoading] = useState(false);

    // 어떤 카드 메뉴가 열려 있는지
    const [menuFor, setMenuFor] = useState(null);

    // 지금 수정 중인 이벤트
    const [editingEvent, setEditingEvent] = useState(null);

    // 수정/추가 화면에서 사용할 폼 state
    const [form, setForm] = useState({
        title: '',
        person: '',
        type: '생일',
        date: '',
        memo: '',
        remindOn: false,
        remindDateTime: '',
    });

    const [guideModalOpen, setGuideModalOpen] = useState(false); // 팝업 열림 여부
    const [guideEvent, setGuideEvent] = useState(null); // 가이드 대상 이벤트

    // ---- API 연동 헬퍼 ----

    // 월별 이벤트 조회: GET /calendar/month
    const fetchMonthEvents = async (year, month) => {
        try {
            setEventsLoading(true);

            // TODO: year/month를 query로 보내는 방식은 추측, 실제 명세에 맞게 수정
            const res = await fetch(`/calendar/month?year=${year}&month=${month}`);
            if (!res.ok) {
                throw new Error(
                    `GET /calendar/month 실패 (status: ${res.status})`
                );
            }

            const data = await res.json();

            // TODO: 실제 응답 구조에 맞게 수정
            //   지금은 data.events 또는 data 자체가 배열이라고 가정
            const rawEvents = data.events || data;

            const normalized = rawEvents.map((ev) => ({
                id: ev.id,
                title: ev.title,
                type: ev.type,
                // 'YYYY-MM-DD' 문자열이라고 가정
                date: ev.date,
                person: ev.personName || ev.person || '',
                memo: ev.memo || '',
                remindOn: ev.remindOn ?? false,
                remindDateTime: ev.remindDateTime || '',
                temp: ev.degree ?? ev.temp ?? 0,
            }));

            setEvents(normalized);
        } catch (err) {
            console.error(err);
            setEvents([]); // 실패 시 비워두기
        } finally {
            setEventsLoading(false);
        }
    };

    // 다가오는 이벤트 조회: GET /events/upcoming
    const fetchUpcomingEvents = async () => {
        try {
            setUpcomingLoading(true);

            const res = await fetch('/events/upcoming');
            if (!res.ok) {
                throw new Error(
                    `GET /events/upcoming 실패 (status: ${res.status})`
                );
            }

            const data = await res.json();
            const rawEvents = data.events || data;

            const base = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
            ).getTime();

            const normalized = rawEvents
                .map((ev) => {
                    const d = new Date(ev.date); // 'YYYY-MM-DD'라고 가정
                    const diff = Math.round(
                        (d.getTime() - base) / (1000 * 60 * 60 * 24)
                    );
                    return {
                        id: ev.id,
                        title: ev.title,
                        type: ev.type,
                        date: ev.date,
                        person: ev.personName || ev.person || '',
                        temp: ev.degree ?? ev.temp ?? 0,
                        memo: ev.memo || '',
                        remindOn: ev.remindOn ?? false,
                        remindDateTime: ev.remindDateTime || '',
                        d,
                        dday: diff,
                    };
                })
                .filter((x) => x.dday >= 0)
                .sort((a, b) => a.d - b.d);

            setUpcoming(normalized);
        } catch (err) {
            console.error(err);
            setUpcoming([]);
        } finally {
            setUpcomingLoading(false);
        }
    };

    // 이벤트 등록: POST /events
    const createEvent = async () => {
        // 필수 값 체크
        if (!form.title || !form.person || !form.date) {
            // 필요하면 alert 추가
            return null;
        }

        try {
            const res = await fetch('/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // TODO: 실제 API 명세에 맞게 필드명 맞추기
                    title: form.title,
                    type: form.type,
                    date: form.date, // 'YYYY-MM-DD' 또는 서버가 요구하는 포맷
                    personName: form.person,
                    memo: form.memo,
                    remindOn: form.remindOn,
                    remindDateTime: form.remindDateTime,
                }),
            });

            if (!res.ok) {
                throw new Error(`POST /events 실패 (status: ${res.status})`);
            }

            const created = await res.json();

            const normalized = {
                id: created.id,
                title: created.title,
                type: created.type,
                date: created.date,
                person: created.personName || created.person || form.person,
                memo: created.memo || form.memo,
                remindOn: created.remindOn ?? form.remindOn,
                remindDateTime: created.remindDateTime || form.remindDateTime,
                temp: created.degree ?? created.temp ?? 0,
            };

            return normalized;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    // 이벤트 수정: PUT /events/{eventId}
    const updateEvent = async (eventId, payload) => {
        try {
            const res = await fetch(`/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`PUT /events/${eventId} 실패 (status: ${res.status})`);
            }

            const updated = await res.json();

            const normalized = {
                id: updated.id,
                title: updated.title,
                type: updated.type,
                date: updated.date,
                person: updated.personName || updated.person || payload.personName,
                memo: updated.memo ?? payload.memo,
                remindOn: updated.remindOn ?? payload.remindOn,
                remindDateTime:
                    updated.remindDateTime || payload.remindDateTime || '',
                temp: updated.degree ?? updated.temp ?? 0,
            };

            return normalized;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    // 이벤트 삭제: DELETE /events/{eventId}
    const deleteEvent = async (eventId) => {
        try {
            const res = await fetch(`/events/${eventId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error(
                    `DELETE /events/${eventId} 실패 (status: ${res.status})`
                );
            }

            // 보통 204 No Content일 거라 별도 처리 없음
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    // ---- 메모리 계산 ----

    const eventsByDate = useMemo(() => {
        const map = new Map();
        for (const ev of events) {
            if (!map.has(ev.date)) map.set(ev.date, []);
            map.get(ev.date).push(ev);
        }
        return map;
    }, [events]);

    const grid = useMemo(() => buildMonthGrid(anchor), [anchor]);
    const monthLabel = `${String(anchor.getFullYear()).slice(
        2
    )}년 ${anchor.getMonth() + 1}월`;

    const selectedKey = toKey(selected);
    const selectedEvents = eventsByDate.get(selectedKey) ?? [];

    const upcomingPreview = useMemo(
        () => upcoming.slice(0, 3),
        [upcoming]
    );

    const prevMonth = () => setAnchor((p) => addMonths(p, -1));
    const nextMonth = () => setAnchor((p) => addMonths(p, 1));

    const onDayClick = (d) => setSelected(d);

    const pillText = (key) => {
        const list = eventsByDate.get(key) ?? [];
        if (list.length === 0) return null;
        if (list.length === 1) return list[0].title;
        return `${list.length}개 이벤트`;
    };

    // ---- 화면 전환 핸들러 ----

    // 이벤트 추가 클릭
    const goAdd = () => {
        setEditingEvent(null);
        setForm({
            title: '',
            person: '',
            type: '생일',
            date: '',
            memo: '',
            remindOn: false,
            remindDateTime: '',
        });
        setView('add');
    };

    // 다가오는 이벤트 클릭
    const goUpcoming = () => setView('upcoming');
    // 뒤로
    const goBack = () => setView('calendar');

    // 점점점 메뉴 토글
    const toggleMenu = (id) => {
        setMenuFor((prev) => (prev === id ? null : id));
    };

    // 폼 값 변경 헬퍼
    const updateForm = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    // 이벤트 수정 눌렀을 때
    const handleEdit = (ev) => {
        setEditingEvent(ev);
        setForm({
            title: ev.title,
            person: ev.person,
            type: ev.type,
            date: ev.date,
            memo: ev.memo || '',
            remindOn: ev.remindOn || false,
            remindDateTime: ev.remindDateTime || '',
        });
        setMenuFor(null);
        setView('edit');
    };

    // 이벤트 삭제 눌렀을 때
    const handleDelete = async (id) => {
        const ok = await deleteEvent(id);
        if (!ok) return;
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setUpcoming((prev) => prev.filter((e) => e.id !== id));
        setMenuFor(null);
    };

    // 이벤트 수정 완료 (수정하기 버튼)
    const handleUpdate = async () => {
        if (!editingEvent) return;

        const payload = {
            // TODO: 실제 PUT /events/{id}의 body 스펙에 맞게 수정
            title: form.title,
            type: form.type,
            date: form.date,
            personName: form.person,
            memo: form.memo,
            remindOn: form.remindOn,
            remindDateTime: form.remindDateTime,
        };

        const updated = await updateEvent(editingEvent.id, payload);
        if (!updated) return;

        setEvents((prev) =>
            prev.map((e) => (e.id === editingEvent.id ? updated : e))
        );
        setUpcoming((prev) =>
            prev.map((e) => (e.id === editingEvent.id ? { ...e, ...updated } : e))
        );

        setEditingEvent(null);
        setView('upcoming'); // 수정 완료 후 돌아가기
    };

    // 이벤트 추가 (추가하기 버튼)
    const handleCreate = async () => {
        const created = await createEvent();
        if (!created) return;

        setEvents((prev) => [...prev, created]);

        // 새 이벤트를 다가오는 이벤트에도 반영
        setUpcoming((prev) => {
            const d = new Date(created.date);
            const base = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
            ).getTime();
            const diff = Math.round(
                (d.getTime() - base) / (1000 * 60 * 60 * 24)
            );
            const withMeta = {
                ...created,
                d,
                dday: diff,
            };
            return [...prev, withMeta].sort((a, b) => a.d - b.d);
        });

        // 방금 추가한 이벤트를 대상으로 팝업 열기
        setGuideEvent(created);
        setGuideModalOpen(true);
    };

    // --- 초기 데이터 로딩: anchor(월) & upcoming ---

    useEffect(() => {
        const y = anchor.getFullYear();
        const m = anchor.getMonth() + 1;
        fetchMonthEvents(y, m);
    }, [anchor]);

    useEffect(() => {
        fetchUpcomingEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 한 번만

    // ---- 뷰 렌더링 ----

    // 다가오는 이벤트
    if (view === 'upcoming') {
        return (
            <div className="CalV2">
                <div className="SubTop">
                    <button type="button" className="BackBtn" onClick={goBack}>
                        ‹ 뒤로
                    </button>
                </div>

                <div className="SubTitleRow">
                    <div className="SubTitle">다가오는 이벤트</div>
                    <div className="SubCount">{upcoming.length}</div>
                </div>

                <div className="WeekRow">
                    {dayNames.map((dn) => (
                        <div key={dn} className="WeekCell">
                            {dn}
                        </div>
                    ))}
                </div>

                {/* 1주만 보이게 (선택된 날 기준) */}
                <div className="WeekStrip">
                    {buildWeekRow(selected).map((cell) => {
                        const key = cell.key;
                        const text = pillText(key);
                        const isToday = isSameDay(cell.date, today);
                        const isSel = isSameDay(cell.date, selected);

                        return (
                            <button
                                key={key}
                                type="button"
                                className={[
                                    'WDay',
                                    isToday ? 'today' : '',
                                    isSel ? 'selected' : '',
                                    text ? 'hasEvent' : '',
                                ].join(' ')}
                                onClick={() => onDayClick(cell.date)}
                            >
                                <div className="WNum">{cell.date.getDate()}</div>
                                {text && <div className="WPill">{text}</div>}
                            </button>
                        );
                    })}
                </div>

                <div className="ListWrap">
                    {upcomingLoading && <div className="UpLoading">불러오는 중…</div>}

                    {!upcomingLoading &&
                        upcoming.map((ev) => (
                            <div key={ev.id} className="UpItem">
                                <div className="UpBar" aria-hidden />
                                <div className="UpCard">
                                    <div className="UpHead">
                                        <div className="UpDate">
                                            <span className="UpMD">
                                                {ev.d.getMonth() + 1}월{' '}
                                                <span className="UpDay">{ev.d.getDate()}일</span>
                                            </span>
                                            <span className="UpDday">
                                                {ev.dday === 0 ? 'D-DAY' : `D-${ev.dday}`}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="UpMore"
                                            aria-label="더보기"
                                            onClick={() => toggleMenu(ev.id)}
                                        >
                                            ⋮
                                        </button>

                                        {menuFor === ev.id && (
                                            <div className="UpMenu">
                                                <button
                                                    type="button"
                                                    className="UpMenuItem"
                                                    onClick={() => handleEdit(ev)}
                                                >
                                                    이벤트 수정
                                                </button>
                                                <button
                                                    type="button"
                                                    className="UpMenuItem danger"
                                                    onClick={() => handleDelete(ev.id)}
                                                >
                                                    이벤트 삭제
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="UpBody">
                                        <div className="UpAvatar" aria-hidden />
                                        <div className="UpText">
                                            <div className="UpTitle">{ev.title}</div>
                                            <div className="UpSub">
                                                <span className="UpName">{ev.person}</span>
                                                <span className="UpMeta">{ev.type}</span>
                                                <span className="UpTemp">
                                                    {String(ev.temp ?? 0)}°
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        );
    }

    // 이벤트 수정
    if (view === 'edit') {
        return (
            <div className="CalV2">
                <div className="SubTop">
                    <button
                        type="button"
                        className="BackBtn"
                        onClick={() => {
                            setView('upcoming');
                            setEditingEvent(null);
                        }}
                    >
                        ‹ 뒤로
                    </button>
                </div>

                <div className="FormWrap">
                    {/* 제목 */}
                    <input
                        className="FormInput"
                        placeholder="제목"
                        value={form.title}
                        onChange={(e) => updateForm('title', e.target.value)}
                    />

                    {/* 지인 프로필 카드 */}
                    <div className="ProfileCard">
                        <div className="ProfileLeft">
                            <div className="ProfileAvatar" aria-hidden />
                            <div className="ProfileText">
                                <div className="ProfileNameRow">
                                    <span className="ProfileName">
                                        {form.person || editingEvent?.person || '지인 이름'}
                                    </span>
                                    <span className="ProfileTemp">
                                        {editingEvent?.temp ?? 30}°
                                    </span>
                                </div>
                                <div className="ProfileRole">{editingEvent?.type}</div>
                            </div>
                        </div>
                        <button type="button" className="ProfileMore">
                            프로필 상세
                        </button>
                    </div>

                    {/* 지인 이름 (수정용 인풋) */}
                    <input
                        className="FormInput"
                        placeholder="지인 이름"
                        value={form.person}
                        onChange={(e) => updateForm('person', e.target.value)}
                    />

                    {/* 이벤트 유형 */}
                    <div className="FormRow">
                        <div className="FormLabel">이벤트 유형</div>
                        <button type="button" className="FormPlus">
                            +
                        </button>
                    </div>

                    <div className="ChipRow">
                        {['생일', '승진', '입사', '퇴사', '결혼', '출산', '병문안', '집들이'].map(
                            (t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`Chip ${form.type === t ? 'selected' : ''}`}
                                    onClick={() => updateForm('type', t)}
                                >
                                    {t}
                                </button>
                            )
                        )}
                    </div>

                    {/* 날짜 */}
                    <div className="FormLabel" style={{ marginTop: 18 }}>
                        날짜
                    </div>
                    <input
                        className="FormInput"
                        placeholder="날짜 (년-월-일)"
                        value={form.date}
                        onChange={(e) => updateForm('date', e.target.value)}
                    />

                    {/* 미리 알림 */}
                    <div className="FormLabel" style={{ marginTop: 18 }}>
                        미리 알림
                    </div>
                    <div className="ReminderField">
                        <input
                            className="ReminderInput"
                            placeholder="2025.12.26 / 오전 10:00"
                            value={form.remindDateTime}
                            onChange={(e) =>
                                updateForm('remindDateTime', e.target.value)
                            }
                        />
                        <label className="Switch Switch--small">
                            <input
                                type="checkbox"
                                checked={form.remindOn}
                                onChange={(e) =>
                                    updateForm('remindOn', e.target.checked)
                                }
                            />
                            <span className="Slider" />
                        </label>
                    </div>

                    {/* 메모 */}
                    <div className="FormLabel" style={{ marginTop: 14 }}>
                        메모
                    </div>
                    <textarea
                        className="FormTextarea"
                        placeholder="이벤트에 관한 간단한 내용을 메모하세요"
                        value={form.memo}
                        onChange={(e) => updateForm('memo', e.target.value)}
                    />

                    <button
                        type="button"
                        className="SubmitBtn"
                        onClick={handleUpdate}
                    >
                        수정하기
                    </button>
                </div>
            </div>
        );
    }

    // 이벤트 추가
    if (view === 'add') {
        return (
            <div className="CalV2">
                <div className="SubTop">
                    <button
                        type="button"
                        className="BackBtn"
                        onClick={() => {
                            setView('calendar');
                            setEditingEvent(null);
                        }}
                    >
                        ‹ 뒤로
                    </button>
                </div>

                <div className="FormWrap">
                    {/* 제목 */}
                    <input
                        className="FormInput"
                        placeholder="제목"
                        value={form.title}
                        onChange={(e) => updateForm('title', e.target.value)}
                    />

                    {/* 지인 이름 입력 */}
                    <input
                        className="FormInput"
                        placeholder="지인 이름"
                        value={form.person}
                        onChange={(e) => updateForm('person', e.target.value)}
                    />

                    {/* 이벤트 유형 */}
                    <div className="FormRow">
                        <div className="FormLabel">이벤트 유형</div>
                        <button type="button" className="FormPlus">
                            +
                        </button>
                    </div>

                    <div className="ChipRow">
                        {['생일', '승진', '입사', '퇴사', '결혼', '출산', '병문안', '집들이'].map(
                            (t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`Chip ${form.type === t ? 'selected' : ''}`}
                                    onClick={() => updateForm('type', t)}
                                >
                                    {t}
                                </button>
                            )
                        )}
                    </div>

                    {/* 날짜 */}
                    <div className="FormLabel" style={{ marginTop: 18 }}>
                        날짜
                    </div>
                    <input
                        className="FormInput"
                        placeholder="날짜 (년.월.일)"
                        value={form.date}
                        onChange={(e) => updateForm('date', e.target.value)}
                    />

                    {/* 미리 알림 */}
                    <div className="FormLabel" style={{ marginTop: 18 }}>
                        미리 알림
                    </div>
                    <div className="ReminderField">
                        <input
                            className="ReminderInput"
                            placeholder="날짜/시간 (년.월.일 / 오전 10:00)"
                            value={form.remindDateTime}
                            onChange={(e) =>
                                updateForm('remindDateTime', e.target.value)
                            }
                        />
                        <label className="Switch Switch--small">
                            <input
                                type="checkbox"
                                checked={form.remindOn}
                                onChange={(e) =>
                                    updateForm('remindOn', e.target.checked)
                                }
                            />
                            <span className="Slider" />
                        </label>
                    </div>

                    {/* 메모 */}
                    <div className="FormLabel" style={{ marginTop: 14 }}>
                        메모
                    </div>
                    <textarea
                        className="FormTextarea"
                        placeholder="이벤트에 관한 간단한 내용을 메모하세요"
                        value={form.memo}
                        onChange={(e) => updateForm('memo', e.target.value)}
                    />

                    <button
                        type="button"
                        className="SubmitBtn"
                        onClick={handleCreate}
                    >
                        추가하기
                    </button>
                </div>

                {/* 이벤트 추가 후 뜨는 팝업 */}
                {guideModalOpen && guideEvent && (
                    <div className="GuideModalOverlay">
                        <div className="GuideModal">
                            <button
                                type="button"
                                className="GuideModalClose"
                                onClick={() => setGuideModalOpen(false)}
                            >
                                ×
                            </button>

                            <div className="GuideModalBody">
                                <div className="GuideModalTitle">
                                    새로운 이벤트가 추가되었습니다.
                                </div>
                                <div className="GuideModalLine">
                                    <span className="GuideModalLinkText">
                                        이벤트에 대한 가이드
                                    </span>
                                    <span className="GuideModalText">
                                        를 확인해 볼까요?
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="GuideModalPrimary"
                                    onClick={() => {
                                        setGuideModalOpen(false);
                                        setView('guide');
                                    }}
                                >
                                    가이드 보기
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 가이드 보기 화면
    if (view === 'guide') {
        const personName = guideEvent?.person || '지인';
        const eventType = guideEvent?.type || '생일';

        // TODO: 여기서 GET /events/{eventId}/guide 호출해서
        //       금액/메시지/행동 가이드를 서버 값으로 교체하면 됨.

        return (
            <div className="CalV2">
                <div className="SubTop">
                    <button
                        type="button"
                        className="BackBtn"
                        onClick={() => setView('calendar')}
                    >
                        ‹ 뒤로
                    </button>
                </div>

                <div className="GuidePage">
                    {/* 헤더 영역 */}
                    <header className="GuideHeader">
                        <h1 className="GuideTitle">TPO 가이드</h1>

                        <p className="GuideMainLine">
                            🎉{' '}
                            <span className="GuideNameHighlight">
                                {personName}
                                {eventType === '생일'
                                    ? ' 님의 생일에는'
                                    : ` 님의 ${eventType}에는`}
                            </span>
                            <br />
                            이 정도가 딱 좋을 것 같아요!
                        </p>

                        <p className="GuideHint">
                            너무 과하지 않게 마음만 전해도 충분해요:)
                        </p>
                    </header>

                    {/* 적정 금액 섹션 */}
                    <section className="GuideSection">
                        <div className="GuideSectionLabel">적정 금액</div>
                        <div className="GuideAmountBox">
                            <div className="GuideAmountMain">
                                20,000원 ~ 30,000원
                            </div>
                            <div className="GuideAmountSub">
                                지인 / 동기 기준 예시 금액
                            </div>
                        </div>
                    </section>

                    {/* 메시지 카드 섹션 */}
                    <section className="GuideSection">
                        <div className="GuideSectionLabel">메시지 카드</div>
                        <div className="GuideMessageBox">
                            <div className="GuideMessageBox">
                                <p className="GuideMessageText" id="guideMessage">
                                    "
                                    {eventType === '생일'
                                        ? '생일 진심으로 축하드려요 🎂 평소에 많이 도와주셔서 감사합니다. 올해도 함께 잘 부탁드립니다!'
                                        : '진심으로 축하드려요 😊 평소에 많이 도와주셔서 감사합니다. 앞으로도 잘 부탁드립니다!'}
                                    "
                                </p>

                                <button
                                    type="button"
                                    className="GuideCopyBtn"
                                    onClick={() => {
                                        const msg =
                                            document.getElementById('guideMessage')
                                                ?.innerText ?? '';
                                        navigator.clipboard.writeText(msg);
                                        alert('메시지가 복사되었어요!');
                                    }}
                                >
                                    복사
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* 행동 가이드 섹션 */}
                    <section className="GuideSection">
                        <div className="GuideSectionHeader">
                            <div className="GuideSectionLeft">
                                <div className="GuideSectionLabel">행동 가이드</div>
                                <div className="GuideSectionCaption">
                                    어떻게 챙기면 좋을까요?
                                </div>
                            </div>
                            <button type="button" className="GuideEditGiftBtn">
                                추천 선물 수정
                            </button>
                        </div>

                        {/* 위에 얇은 요약 카드 */}
                        <div className="GuideActionSummaryBox">
                            2~3만 원대 기프트 카드 + 생일 축하 메시지(손편지)
                        </div>

                        {/* 아래 내용 카드 */}
                        <div className="GuideActionBox">
                            <ul className="GuideActionList">
                                <li>직접 건네거나 회사 메신저로 감사 인사 함께 전달</li>
                                <li>과하면 부담 느끼실 수 있어요</li>
                                <li>이번 주 팀 미팅 전에 건네면 타이밍 굿! 👍</li>
                            </ul>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    // 기본 캘린더
    return (
        <div className="CalV2">
            <div className="TopActionRow">
                <button type="button" className="AddLink" onClick={goAdd}>
                    이벤트 추가
                </button>
            </div>

            <div className="MonthRow">
                <button
                    type="button"
                    className="MonthArrow"
                    onClick={prevMonth}
                    aria-label="이전 달"
                >
                    ‹
                </button>
                <div className="MonthLabel">{monthLabel}</div>
                <button
                    type="button"
                    className="MonthArrow"
                    onClick={nextMonth}
                    aria-label="다음 달"
                >
                    ›
                </button>
            </div>

            <div className="WeekRow">
                {dayNames.map((dn) => (
                    <div key={dn} className="WeekCell">
                        {dn}
                    </div>
                ))}
            </div>

            <div className="Grid">
                {eventsLoading && (
                    <div className="CalendarLoading">달력을 불러오는 중…</div>
                )}

                {!eventsLoading &&
                    grid.map((cell) => {
                        const key = cell.key;
                        const text = pillText(key);

                        const isToday = isSameDay(cell.date, today);
                        const inMonth = cell.inMonth;

                        return (
                            <button
                                key={key}
                                type="button"
                                className={[
                                    'Day',
                                    inMonth ? 'in' : 'out',
                                    isToday ? 'today' : '',
                                    text ? 'hasEvent' : '',
                                ].join(' ')}
                                onClick={() => onDayClick(cell.date)}
                            >
                                <span className="Num">{cell.date.getDate()}</span>
                                {text && <span className="Pill">{text}</span>}
                            </button>
                        );
                    })}
            </div>

            <div className="Upcoming">
                <div
                    className="UpcomingHeader"
                    onClick={goUpcoming}
                    role="button"
                    tabIndex={0}
                >
                    <div className="left">
                        <span className="title">다가오는 이벤트</span>
                        <span className="count">{upcomingPreview.length}</span>
                        <span className="chev">›</span>
                    </div>
                </div>

                <div className="CardRow">
                    {upcomingPreview.map((ev) => (
                        <div key={ev.id} className="Card">
                            <div className="CardTop">
                                <div className="CardDate">
                                    {ev.d.getMonth() + 1}월 {ev.d.getDate()}일
                                </div>
                                <div className="CardDday">
                                    {ev.dday === 0 ? 'D-DAY' : `D-${ev.dday}`}
                                </div>
                            </div>

                            <div className="AvatarWrap">
                                <div className="Avatar" aria-hidden />
                            </div>

                            <div className="CardTitle">{ev.title}</div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedEvents.length > 0 && (
                <div className="HiddenList">
                    <div className="HiddenListTop">
                        <span>
                            {selected.getMonth() + 1}월 {selected.getDate()}일
                        </span>
                        <span className="n">{selectedEvents.length}개</span>
                    </div>
                    <ul>
                        {selectedEvents.map((ev) => (
                            <li key={ev.id}>{ev.title}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Calendar;
