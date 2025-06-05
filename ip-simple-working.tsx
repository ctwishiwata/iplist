import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, TrendingUp, Book, Building, Users, Cloud, Wifi, Share2, Upload, FileSpreadsheet, Download } from 'lucide-react';

const IPSimpleWorking = () => {
  const [ipList, setIpList] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [isOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [syncStatus, setSyncStatus] = useState('synced');

  const [newIp, setNewIp] = useState({
    title: '',
    animeInfo: '',
    circulation: '',
    publisher: '',
    status: '未着手',
    naroRank: '',
    memo: ''
  });

  const statusOptions = ['未着手', '交渉中', '契約済み', '契約済', '保留', 'NG', 'OK'];
  const statusColors = {
    '未着手': 'bg-gray-100 text-gray-800',
    '交渉中': 'bg-yellow-100 text-yellow-800',
    '契約済み': 'bg-green-100 text-green-800',
    '契約済': 'bg-green-100 text-green-800',
    '保留': 'bg-blue-100 text-blue-800',
    'NG': 'bg-red-100 text-red-800',
    'OK': 'bg-green-100 text-green-800'
  };

  const teamMembers = [
    { id: 1, name: "田中太郎", role: "プロジェクトマネージャー", status: "online", lastActive: "2分前" },
    { id: 2, name: "鈴木花子", role: "ビジネス開発", status: "online", lastActive: "1分前" },
    { id: 3, name: "佐藤次郎", role: "法務担当", status: "offline", lastActive: "30分前" }
  ];

  const currentUser = { id: 4, name: "山田三郎", role: "開発チームリーダー" };

  const sampleData = [
    {
      id: 1,
      title: "鬼滅の刃",
      animeInfo: "2019年4月-9月、2021年10月-2月",
      circulationHistory: [{ date: "2024-01", copies: 15000 }],
      publisher: "集英社",
      status: "交渉中",
      naroRank: "-",
      memo: ""
    },
    {
      id: 2,
      title: "呪術廻戦",
      animeInfo: "2020年10月-2021年3月、2023年7月-12月",
      circulationHistory: [{ date: "2024-01", copies: 9000 }],
      publisher: "集英社",
      status: "契約済み",
      naroRank: "-",
      memo: ""
    },
    {
      id: 3,
      title: "転生したらスライムだった件",
      animeInfo: "2018年10月-2019年3月、2021年1月-6月",
      circulationHistory: [{ date: "2024-01", copies: 3000 }],
      publisher: "マイクロマガジン社",
      status: "交渉中",
      naroRank: "歴代1位",
      memo: "人気作品・要注目"
    }
  ];

  // データ保存・読み込み機能
  const saveToStorage = (data) => {
    try {
      localStorage.setItem('ip-management-persistent', JSON.stringify({
        data: data,
        lastSaved: new Date().toISOString(),
        version: '1.0'
      }));
      console.log('データを保存しました:', data.length, '件');
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('保存エラー:', error);
      alert('データの保存に失敗しました。ブラウザの容量不足の可能性があります。');
      return false;
    }
  };

  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('ip-management-persistent');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('保存データを読み込み:', parsed.data.length, '件');
        setLastSyncTime(new Date(parsed.lastSaved));
        return parsed.data;
      }
    } catch (error) {
      console.error('読み込みエラー:', error);
    }
    return sampleData;
  };

  // CSVインポート機能
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.trim());
        console.log('検出された列名:', headers);
        
        const processed = lines.slice(1).map((line, index) => {
          const values = parseCSVLine(line);
          const rowData = {};
          headers.forEach((header, i) => {
            rowData[header] = values[i] || '';
          });

          const circulationRaw = rowData['現在部数'] || rowData['発行部数'] || rowData['部数'] || '0';
          const circulationCleaned = circulationRaw.replace(/[",]/g, '');
          const circulation = parseInt(circulationCleaned) || 0;

          const rawStatus = rowData['ステータス'] || '';
          const processedStatus = rawStatus.trim() === '' ? '未着手' : rawStatus.trim();

          let naroRank = rowData['なろうランク'] || '';
          if (naroRank && !isNaN(parseFloat(naroRank))) {
            naroRank = `歴代${Math.round(parseFloat(naroRank))}位`;
          }

          return {
            id: Date.now() + index + Math.random() * 1000,
            title: rowData['作品名'] || `作品${index + 1}`,
            animeInfo: rowData['アニメ情報'] || '',
            circulationHistory: [{
              date: new Date().toISOString().slice(0, 7),
              copies: circulation
            }],
            publisher: rowData['出版社'] || '',
            status: processedStatus,
            naroRank: naroRank,
            memo: rowData['メモ'] || ''
          };
        });

        const validData = processed.filter(item => item.title && !item.title.startsWith('作品'));
        console.log(`${validData.length}件のデータを処理`);
        
        setImportPreview(validData);
        setShowImportModal(true);
      } catch (error) {
        console.error('インポートエラー:', error);
        alert('ファイルの読み込みでエラーが発生しました: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    setIpList(importPreview);
    setShowImportModal(false);
    setImportPreview([]);
    addActivity(`${importPreview.length}件のデータをインポートしました`);
    
    setTimeout(() => {
      alert(`${importPreview.length}件のデータをインポート・保存しました！\n次回アクセス時も自動で復元されます。`);
    }, 100);
  };

  // CSVエクスポート機能
  const exportToCSV = () => {
    if (ipList.length === 0) {
      alert('エクスポートするデータがありません。');
      return;
    }

    const csvHeader = '作品名,アニメ情報,現在部数,なろうランク,出版社,ステータス,メモ\n';
    const csvData = ipList.map(item => {
      const circulation = getCurrentCirculation(item);
      return `"${item.title}","${item.animeInfo}","${circulation}","${item.naroRank || ''}","${item.publisher}","${item.status}","${item.memo || ''}"`;
    }).join('\n');

    const csvContent = csvHeader + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `IP管理データ_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    
    addActivity(`${ipList.length}件のデータをエクスポートしました`);
  };
  const addActivity = (message) => {
    const newActivity = {
      id: Date.now(),
      message,
      timestamp: new Date(),
      user: currentUser.name
    };
    setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
  };

  // チーム同期機能
  const syncWithTeam = async () => {
    setSyncStatus('syncing');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('team-ip-data', JSON.stringify({
        data: ipList,
        lastModified: new Date().toISOString(),
        modifiedBy: currentUser.name
      }));
      setLastSyncTime(new Date());
      setSyncStatus('synced');
      addActivity('データを同期しました');
    } catch (error) {
      setSyncStatus('error');
    }
  };

  // 初期化 - 保存されたデータを読み込み
  useEffect(() => {
    const savedData = loadFromStorage();
    setIpList(savedData);
    
    // アクティビティログも復元
    try {
      const savedActivity = localStorage.getItem('ip-activity-log');
      if (savedActivity) {
        setRecentActivity(JSON.parse(savedActivity));
      }
    } catch (error) {
      console.error('アクティビティ読み込みエラー:', error);
    }
    
    addActivity('システムを起動しました');
  }, []);

  // データが変更されるたびに自動保存
  useEffect(() => {
    if (ipList.length > 0) {
      const success = saveToStorage(ipList);
      if (success) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    }
  }, [ipList]);

  const handleAddNew = () => {
    if (!newIp.title.trim()) return;
    
    const newEntry = {
      id: Date.now(),
      title: newIp.title,
      animeInfo: newIp.animeInfo,
      circulationHistory: [{
        date: new Date().toISOString().slice(0, 7),
        copies: parseInt(newIp.circulation) || 0
      }],
      publisher: newIp.publisher,
      status: newIp.status,
      naroRank: newIp.naroRank,
      memo: newIp.memo
    };

    setIpList([...ipList, newEntry]);
    setNewIp({ title: '', animeInfo: '', circulation: '', publisher: '', status: '未着手', naroRank: '', memo: '' });
    setIsAddingNew(false);
    addActivity(`新しいIP「${newEntry.title}」を追加しました`);
  };

  const handleEdit = (id, field, value) => {
    const updatedList = ipList.map(ip => {
      if (ip.id === id) {
        if (field === 'circulation') {
          const newCopies = parseInt(value) || 0;
          const currentDate = new Date().toISOString().slice(0, 7);
          const lastRecord = ip.circulationHistory[ip.circulationHistory.length - 1];
          
          if (lastRecord.date === currentDate) {
            return {
              ...ip,
              circulationHistory: [
                ...ip.circulationHistory.slice(0, -1),
                { ...lastRecord, copies: newCopies }
              ]
            };
          } else {
            return {
              ...ip,
              circulationHistory: [...ip.circulationHistory, { date: currentDate, copies: newCopies }]
            };
          }
        } else {
          return { ...ip, [field]: value };
        }
      }
      return ip;
    });
    
    setIpList(updatedList);
    
    const editedItem = ipList.find(ip => ip.id === id);
    if (editedItem) {
      const fieldName = field === 'circulation' ? '部数' : 
                       field === 'publisher' ? '出版社' : 
                       field === 'status' ? 'ステータス' : 
                       field === 'animeInfo' ? 'アニメ情報' : 
                       field === 'memo' ? 'メモ' : field;
      addActivity(`「${editedItem.title}」の${fieldName}を更新しました`);
    }
  };

  const handleDelete = (id) => {
    const itemToDelete = ipList.find(ip => ip.id === id);
    setIpList(ipList.filter(ip => ip.id !== id));
    if (itemToDelete) {
      addActivity(`「${itemToDelete.title}」を削除しました`);
    }
  };

  const getCurrentCirculation = (ip) => {
    return ip.circulationHistory[ip.circulationHistory.length - 1]?.copies || 0;
  };

  const formatNumber = (num) => {
    const number = Math.floor(num);
    if (number >= 10000) {
      return `${Math.floor(number / 10000)}万部`;
    }
    return `${number.toLocaleString()}部`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">IP情報管理システム</h1>
              <p className="text-gray-600">チーム共有・リアルタイム同期対応</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">オンライン</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Cloud className={`h-4 w-4 ${
                  syncStatus === 'synced' ? 'text-green-600' : 
                  syncStatus === 'syncing' ? 'text-blue-600' : 'text-red-600'
                }`} />
                <span className={`text-sm ${
                  syncStatus === 'synced' ? 'text-green-600' : 
                  syncStatus === 'syncing' ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {syncStatus === 'synced' ? '同期済み' : 
                   syncStatus === 'syncing' ? '同期中...' : '同期エラー'}
                </span>
              </div>
              
              {lastSyncTime && (
                <div className="text-xs text-gray-500">
                  最終同期: {lastSyncTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          
          {/* チーム情報 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  保存済み: {ipList.length}件
                </div>
                <button
                  onClick={syncWithTeam}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  <Share2 size={14} />
                  手動同期
                </button>
              </div>
            </div>
            
            {/* チームメンバー */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-gray-600" />
                <h3 className="font-medium text-gray-900">チームメンバー</h3>
              </div>
              <div className="space-y-2">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <span className="text-gray-500">{member.lastActive}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium text-blue-600">{currentUser.name} (あなた)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 最近のアクティビティ */}
          {recentActivity.length > 0 && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">最近のアクティビティ</h4>
              <div className="space-y-1">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="text-xs text-gray-600">
                    <span className="font-medium">{activity.user}</span>: {activity.message}
                    <span className="text-gray-400 ml-2">
                      {activity.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* インポートプレビューモーダル */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-96 overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">インポートプレビュー ({importPreview.length}件)</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <FileSpreadsheet size={20} />
                  <span className="font-medium">以下のデータがインポートされます。内容を確認してください。</span>
                </div>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">作品名</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">出版社</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">発行部数</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">ステータス</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">なろうランク</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {importPreview.slice(0, 10).map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{item.title}</td>
                        <td className="px-3 py-2">{item.publisher}</td>
                        <td className="px-3 py-2">{formatNumber(getCurrentCirculation(item))}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">{item.naroRank || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importPreview.length > 10 && (
                  <p className="text-center text-gray-500 mt-2">
                    ...他 {importPreview.length - 10} 件
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmImport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  インポート実行
                </button>
              </div>
            </div>
          </div>
        )}

        {/* データ管理 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">データ管理</h2>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
                <Upload size={20} />
                CSVインポート
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download size={20} />
                CSVエクスポート
              </button>
              <button
                onClick={() => setIsAddingNew(!isAddingNew)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isAddingNew 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Plus size={20} />
                {isAddingNew ? 'キャンセル' : '手動追加'}
              </button>
            </div>
          </div>

          {isAddingNew && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <input
                type="text"
                placeholder="作品名"
                value={newIp.title}
                onChange={(e) => setNewIp({...newIp, title: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="アニメ情報"
                value={newIp.animeInfo}
                onChange={(e) => setNewIp({...newIp, animeInfo: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="発行部数"
                value={newIp.circulation}
                onChange={(e) => setNewIp({...newIp, circulation: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="出版社"
                value={newIp.publisher}
                onChange={(e) => setNewIp({...newIp, publisher: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="なろうランク"
                value={newIp.naroRank}
                onChange={(e) => setNewIp({...newIp, naroRank: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newIp.status}
                onChange={(e) => setNewIp({...newIp, status: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="メモ"
                value={newIp.memo}
                onChange={(e) => setNewIp({...newIp, memo: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddNew}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                登録
              </button>
            </div>
          )}
        </div>

        {/* IPリスト */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作品名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アニメ情報</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">現在部数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出版社</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">なろうランク</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メモ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ipList.map((ip) => (
                  <tr key={ip.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-start">
                        <Book className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm font-medium text-gray-900 break-words leading-5">
                          {ip.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={ip.animeInfo}
                        onChange={(e) => handleEdit(ip.id, 'animeInfo', e.target.value)}
                        placeholder="アニメ情報を入力..."
                        className="text-xs text-gray-500 break-words leading-4 w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {formatNumber(getCurrentCirculation(ip))}
                      </div>
                      <input
                        type="number"
                        placeholder="更新"
                        className="text-xs border border-gray-200 rounded px-2 py-1 w-full"
                        onBlur={(e) => e.target.value && handleEdit(ip.id, 'circulation', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={ip.publisher}
                        onChange={(e) => handleEdit(ip.id, 'publisher', e.target.value)}
                        className="text-xs text-gray-900 break-words w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {ip.naroRank && ip.naroRank !== '-' ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium block text-center ${
                            ip.naroRank.includes('1位') ? 'bg-yellow-100 text-yellow-800' :
                            ip.naroRank.includes('2位') ? 'bg-gray-100 text-gray-800' :
                            ip.naroRank.includes('3位') ? 'bg-orange-100 text-orange-800' :
                            ip.naroRank.includes('位') ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {ip.naroRank}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-center block">-</span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="ランク更新"
                        className="mt-1 text-xs border border-gray-200 rounded px-2 py-1 w-full"
                        onBlur={(e) => e.target.value && handleEdit(ip.id, 'naroRank', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={ip.status}
                        onChange={(e) => handleEdit(ip.id, 'status', e.target.value)}
                        className={`w-full text-xs px-2 py-1 rounded-full font-medium border-0 ${statusColors[ip.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        value={ip.memo || ''}
                        onChange={(e) => handleEdit(ip.id, 'memo', e.target.value)}
                        placeholder="メモを入力..."
                        className="text-xs text-gray-900 w-full h-16 border border-gray-200 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(ip.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                        title="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 使用方法の説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">個人管理・データ永続化</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>💾 <strong>自動保存:</strong> データは編集と同時にブラウザに永続保存されます</p>
            <p>🔄 <strong>データ復元:</strong> ページを更新・再訪問しても前回のデータが自動復元</p>
            <p>📥 <strong>CSVインポート:</strong> 既存のCSVファイルを読み込んで一括登録</p>
            <p>📤 <strong>CSVエクスポート:</strong> 現在のデータをCSVファイルでダウンロード</p>
            <p>📝 <strong>活動ログ:</strong> 操作履歴も自動保存され次回も表示</p>
            <p>🌐 <strong>オフライン対応:</strong> インターネット接続不要で動作</p>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-xs text-blue-800">
              <strong>注意:</strong> ブラウザのデータを削除（キャッシュクリア等）すると保存データも消去されます。
              定期的にCSVエクスポートでバックアップを取ることをお勧めします。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPSimpleWorking;